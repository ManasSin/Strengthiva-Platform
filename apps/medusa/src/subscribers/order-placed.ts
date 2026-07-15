import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Purchase History — relays Medusa's order.placed event to strengthiva-backend
 * so it isn't lost before purchase-aware recommendations (v2) exists to consume
 * it. See docs/platform-architecture/tech-specs/backend/purchase-history.md.
 *
 * Medusa v2 has no generic incoming-webhook system for arbitrary external
 * endpoints (that's a Shopify/Stripe-style concept) — a subscriber is
 * Medusa-side custom code that reacts to an internal event and, here, makes its
 * own outbound HTTP call. Confirmed against @medusajs/core-flows' complete-cart
 * workflow directly: it emits OrderWorkflowEvents.PLACED ("order.placed"), not
 * "order.completed" as an earlier draft of the spec assumed.
 *
 * Fails soft — logs and returns rather than throwing — because this is fire
 * a purchase-history record, not a step in fulfilling the order; the customer's
 * order must not be affected by strengthiva-backend being briefly unreachable.
 * The local (in-memory) event bus this project runs on has no redelivery/DLQ
 * for a subscriber that throws anyway, so throwing here would just silently
 * drop the event with an extra stack trace in the log, not actually retry it.
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const orderModuleService = container.resolve(Modules.ORDER)

  let order
  try {
    order = await orderModuleService.retrieveOrder(data.id, {
      relations: ["items"],
    })
  } catch (error: any) {
    logger.error(`purchase-history: failed to retrieve order ${data.id} — ${error.message}`)
    return
  }

  if (!order.email) {
    // Shouldn't happen for a placed order, but the email match on the FastAPI
    // side needs something to match against.
    logger.warn(`purchase-history: order ${order.id} has no email — skipping`)
    return
  }

  const payload = {
    medusa_order_id: order.id,
    email: order.email,
    line_items: (order.items ?? []).map((item) => ({
      medusa_product_id: item.product_id ?? null,
      medusa_variant_id: item.variant_id ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
    ordered_at: order.created_at,
  }

  try {
    const response = await fetch(
      `${process.env.FASTAPI_URL}/api/v1/webhooks/medusa/order-completed`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Medusa-Service-Key": process.env.MEDUSA_SERVICE_KEY ?? "",
        },
        body: JSON.stringify(payload),
      }
    )
    if (!response.ok) {
      logger.error(
        `purchase-history: strengthiva-backend rejected order ${order.id} — HTTP ${response.status}`
      )
    }
  } catch (error: any) {
    logger.error(
      `purchase-history: failed to reach strengthiva-backend for order ${order.id} — ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
