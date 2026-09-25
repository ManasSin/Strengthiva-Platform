import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CheckIcon } from "@modules/common/components/store-icons"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  return (
    <section className="section" style={{ maxWidth: 720, marginInline: "auto" }}>
      <div className="container">
        {isOnboarding && (
          <div style={{ marginBottom: 28 }}>
            <OnboardingCta orderId={order.id} />
          </div>
        )}
        <div
          className="center"
          style={{ textAlign: "center" }}
          data-testid="order-complete-container"
        >
          <div
            style={{
              width: 60,
              height: 60,
              margin: "0 auto 20px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              display: "grid",
              placeItems: "center",
              color: "var(--green-deep)",
            }}
          >
            <CheckIcon />
          </div>
          <p className="eyebrow" style={{ textAlign: "center" }}>
            Order confirmed
          </p>
          <h1 className="h2">Thank you — your order is placed</h1>
          <p
            className="lead"
            style={{ textAlign: "center", margin: "12px auto 0" }}
            data-testid="order-email"
          >
            Order #{order.display_id} · Confirmation sent to {order.email}
          </p>
        </div>

        <div className="panel legacy-scope" style={{ marginTop: 36 }}>
          <h3 style={{ marginBottom: 14 }}>Order #{order.display_id}</h3>
          <Items order={order} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
        </div>

        <div
          className="row"
          style={{ justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}
        >
          <LocalizedClientLink href="/account/orders" className="btn btn-primary">
            Track your order
          </LocalizedClientLink>
          <LocalizedClientLink href="/store" className="btn btn-secondary">
            Continue shopping
          </LocalizedClientLink>
        </div>

        <div className="panel center" style={{ marginTop: 32, textAlign: "center" }}>
          <p className="eyebrow" style={{ textAlign: "center" }}>
            One more thing
          </p>
          <h3 style={{ marginTop: 6 }}>
            Want a plan built around your constitution?
          </h3>
          <p className="muted" style={{ marginTop: 8, fontSize: 14.5 }}>
            Take the free assessment while your order is on its way — it&apos;s
            optional and separate from this order.
          </p>
          <LocalizedClientLink
            href="/personalized"
            className="btn btn-ghost btn-arrow"
            style={{ marginTop: 12 }}
          >
            Take the assessment
          </LocalizedClientLink>
        </div>

        <Help />
      </div>
    </section>
  )
}
