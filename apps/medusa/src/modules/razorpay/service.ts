import { AbstractPaymentProvider, MedusaError } from "@medusajs/framework/utils"
import type { Logger } from "@medusajs/framework/types"
import type {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
  PaymentSessionStatus,
} from "@medusajs/framework/types"
// @ts-ignore — razorpay ships its own .d.ts but as CJS `export =`, which the
// framework's tsconfig (esModuleInterop off in some build paths) sometimes
// still flags; matches how the package's own docs import it.
import Razorpay from "razorpay"
// validatePaymentVerification (Checkout.js callback signature check) is only
// exported from this internal utils module, not as a static on the Razorpay
// class itself (unlike validateWebhookSignature, which is) — confirmed by
// reading razorpay.d.ts directly, not assumed.
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils"

type Options = {
  key_id: string
  key_secret: string
  webhook_secret: string
}

type InjectedDependencies = {
  logger: Logger
}

// Data shape stashed in the PaymentSession/Payment's `data` field across calls —
// see cart-bridge.md's sibling doc, payments-razorpay.md, for the "why".
type RazorpayData = {
  order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
  [key: string]: unknown
}

/**
 * Custom Razorpay AbstractPaymentProvider — see docs/platform-architecture/
 * tech-specs/medusa/payments-razorpay.md for why this is hand-built rather than
 * using either of the two community plugins vetted first (both had concrete,
 * confirmed bugs in exactly the capture/cancel logic that matters most for real
 * money handling).
 *
 * Flow this actually implements — corrected after checking Medusa v2's real
 * Store API routes directly: there is NO endpoint to update a payment
 * session's `data` from the storefront (only a create route exists under
 * /store/payment-collections/{id}/payment-sessions) — updatePayment below is
 * effectively unreachable from a browser in the standard flow, so
 * authorizePayment can NOT rely on Checkout.js's callback values being present.
 * 1. initiatePayment: creates a Razorpay Order, returns its id as the payment
 *    session's id.
 * 2. Storefront runs Razorpay's Checkout.js against that order id (see
 *    apps/store/src/modules/checkout/components/payment-button — the
 *    RazorpayPaymentButton case). On success, it calls completeCart directly
 *    (no update-session round-trip) — this invokes authorizePayment with
 *    whatever `data` initiatePayment stored, i.e. just `{order_id}`, no
 *    payment_id/signature. authorizePayment handles this by opportunistically
 *    checking Razorpay directly for whether the order is already paid (a
 *    server-to-server lookup, no signature involved) before falling back to
 *    `pending_authorization` — exactly the "async payment methods" case the
 *    AbstractPaymentProvider docs describe: the cart still completes and an
 *    order is created in an awaiting-payment state.
 * 3. Razorpay's webhook (payment.authorized/payment.captured/payment.failed)
 *    hits getWebhookActionAndData as the authoritative confirmation path —
 *    needed regardless of step 2's opportunistic check, since UPI in
 *    particular can confirm well after Checkout.js returns.
 * (validatePaymentVerification / razorpay_signature are still used if a
 * payment_id+signature ever DO arrive in `data` some other way — e.g. a future
 * custom endpoint — verified properly rather than trusted blindly, but nothing
 * in the current storefront flow populates them.)
 *
 * IMPORTANT — two distinct secrets, easy to mix up: `key_secret` (the API
 * secret, used for validatePaymentVerification — the Checkout.js callback
 * signature) is NOT the same value as `webhook_secret` (configured separately in
 * the Razorpay dashboard, used only for validateWebhookSignature). The
 * razorpay package's own .d.ts doc-comments both as "webhook secret", which is
 * only accurate for one of the two — confirmed against Razorpay's own public
 * API docs, not assumed from the SDK's (misleading) inline comment.
 */
class RazorpayProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "razorpay"

  protected logger_: Logger
  protected options_: Options
  protected client_: Razorpay

  static validateOptions(options: Record<string, unknown>) {
    if (!options.key_id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "razorpay: `key_id` option is required")
    }
    if (!options.key_secret) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "razorpay: `key_secret` option is required")
    }
    if (!options.webhook_secret) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "razorpay: `webhook_secret` option is required")
    }
  }

  constructor(container: InjectedDependencies, options: Options) {
    // @ts-ignore — matches the pattern used by Medusa's own bundled providers
    // and this repo's strengthiva-sso auth provider.
    super(...arguments)
    this.logger_ = container.logger
    this.options_ = options
    this.client_ = new Razorpay({ key_id: options.key_id, key_secret: options.key_secret })
  }

  // Medusa represents amounts as decimal currency units (e.g. 900.00 INR);
  // Razorpay requires the smallest currency subunit (paise) as an integer.
  private toSubunits(amount: number): number {
    return Math.round(amount * 100)
  }

  private mapRazorpayStatus(status: string): PaymentSessionStatus {
    switch (status) {
      case "captured":
        return "captured"
      case "authorized":
        return "authorized"
      case "refunded":
        return "canceled"
      case "failed":
        return "canceled"
      default:
        return "pending_authorization"
    }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const order = await this.client_.orders.create({
      amount: this.toSubunits(Number(input.amount)),
      currency: input.currency_code.toUpperCase(),
      notes: input.context?.customer?.email
        ? { customer_email: input.context.customer.email }
        : undefined,
    })

    return {
      id: order.id,
      data: { order_id: order.id },
      status: "pending_authorization",
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // The storefront posts Checkout.js's callback values (razorpay_payment_id/
    // razorpay_signature) here before completing the cart — see the module
    // docstring's step 3. Merge rather than replace so order_id (set by
    // initiatePayment) survives.
    const existing = (input.data ?? {}) as RazorpayData
    return { data: { ...existing, ...(input.data ?? {}) } }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = (input.data ?? {}) as RazorpayData
    const { order_id, razorpay_payment_id, razorpay_signature } = data

    if (!order_id || !razorpay_payment_id || !razorpay_signature) {
      // Medusa's Store API has no "update payment session data" endpoint at all
      // (confirmed by reading its actual route files — only a create route
      // exists under /store/payment-collections/{id}/payment-sessions) — so the
      // storefront has no way to post Checkout.js's razorpay_payment_id/
      // signature back before calling completeCart, and this branch is not a
      // rare edge case, it's the *normal* path every time. Opportunistically
      // check whether Razorpay already shows this order as paid — no signature
      // needed for this, it's a server-to-server lookup by order_id, not a
      // client-submitted value being trusted — before falling back to
      // pending_authorization, which is what the AbstractPaymentProvider docs
      // call out as correct for genuinely-async methods either way (the webhook
      // remains the authoritative confirmation regardless of this check).
      if (order_id) {
        try {
          const order = await this.client_.orders.fetch(order_id)
          if (order.status === "paid") {
            const { items: payments } = await this.client_.orders.fetchPayments(order_id)
            const captured = payments.find((p) => p.status === "captured")
            if (captured) {
              return { data: { ...data, ...captured }, status: "captured" }
            }
          }
        } catch (error: any) {
          this.logger_?.warn?.(
            `razorpay: opportunistic order-paid check failed for ${order_id} — ${error.message}`
          )
        }
      }
      return { data, status: "pending_authorization" }
    }

    const valid = validatePaymentVerification(
      { order_id, payment_id: razorpay_payment_id },
      razorpay_signature,
      // key_secret, not webhook_secret — see the module docstring's note on
      // the SDK's misleading doc-comment.
      this.options_.key_secret
    )
    if (!valid) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "razorpay: payment signature verification failed"
      )
    }

    const payment = await this.client_.payments.fetch(razorpay_payment_id)
    return {
      data: { ...data, ...payment },
      status: this.mapRazorpayStatus(payment.status),
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const data = (input.data ?? {}) as RazorpayData
    const paymentId = data.razorpay_payment_id
    if (!paymentId) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "razorpay: no payment to capture")
    }

    const payment = await this.client_.payments.fetch(paymentId)
    if (payment.status === "captured") {
      // Auto-capture is on for this account — nothing left to do.
      return { data: { ...data, ...payment } }
    }

    const captured = await this.client_.payments.capture(paymentId, payment.amount, payment.currency)
    return { data: { ...data, ...captured } }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const data = (input.data ?? {}) as RazorpayData
    const paymentId = data.razorpay_payment_id
    if (!paymentId) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "razorpay: no payment to refund")
    }

    const refund = await this.client_.payments.refund(paymentId, {
      amount: this.toSubunits(Number(input.amount)),
    })
    return { data: { ...data, last_refund: refund } }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const data = (input.data ?? {}) as RazorpayData
    const paymentId = data.razorpay_payment_id
    if (!paymentId) {
      // Never got as far as an authorized/captured payment (e.g. the cart was
      // abandoned before Checkout.js ran) — nothing cancellable, that's fine,
      // not an error (unlike the devx-commerce plugin, which threw here always).
      return { data }
    }

    const payment = await this.client_.payments.fetch(paymentId)
    if (payment.status !== "authorized" && payment.status !== "captured") {
      // Already failed/refunded/created-only — nothing actionable.
      return { data }
    }

    // Razorpay has no separate "void an authorization" endpoint — refunding in
    // full is how an authorized-but-uncaptured payment gets released, and it's
    // also the correct action for a captured one. Matches the SGFGOV plugin's
    // (correct) approach here, not devx-commerce's (which always throws).
    const refund = await this.client_.payments.refund(paymentId, {})
    return { data: { ...data, last_refund: refund } }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    // Razorpay has no concept distinct from cancellation here.
    return this.cancelPayment(input)
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const data = (input.data ?? {}) as RazorpayData
    const paymentId = data.razorpay_payment_id
    if (!paymentId) {
      return { data, status: "pending_authorization" }
    }

    const payment = await this.client_.payments.fetch(paymentId)
    return { data: { ...data, ...payment }, status: this.mapRazorpayStatus(payment.status) }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const data = (input.data ?? {}) as RazorpayData
    const paymentId = data.razorpay_payment_id
    if (!paymentId) {
      return { data }
    }
    const payment = await this.client_.payments.fetch(paymentId)
    return { data: { ...data, ...payment } }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const { data: event, rawData, headers } = payload
    const signature = String((headers as Record<string, string>)?.["x-razorpay-signature"] ?? "")

    const isValid = Razorpay.validateWebhookSignature(
      rawData.toString(),
      signature,
      this.options_.webhook_secret
    )
    if (!isValid) {
      this.logger_.warn("razorpay: webhook signature validation failed")
      return { action: "failed" }
    }

    const entity = (event as any)?.payload?.payment?.entity

    if (!entity) {
      return { action: "not_supported" }
    }

    // session_id must be the same value initiatePayment returned as `id`
    // (the Razorpay order id) — that's what Medusa's Payment Module uses to
    // look up which PaymentSession this event belongs to.
    const session_id = entity.order_id as string
    const amount = (entity.amount as number) / 100

    switch ((event as any).event) {
      case "payment.captured":
        return { action: "captured", data: { session_id, amount } }
      case "payment.authorized":
        return { action: "authorized", data: { session_id, amount } }
      case "payment.failed":
        return { action: "failed", data: { session_id, amount } }
      case "refund.processed":
        return { action: "not_supported" } // refunds are already reflected via refundPayment's own return value
      default:
        return { action: "not_supported" }
    }
  }
}

export default RazorpayProviderService
