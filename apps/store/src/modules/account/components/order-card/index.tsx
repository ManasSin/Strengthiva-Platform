import { useMemo } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const TRACK_STEPS = ["Order placed", "Packed", "Shipped", "Delivered"] as const

const PACKED_STATUSES = [
  "partially_fulfilled",
  "fulfilled",
  "partially_shipped",
  "shipped",
  "partially_delivered",
  "delivered",
]
const SHIPPED_STATUSES = [
  "partially_shipped",
  "shipped",
  "partially_delivered",
  "delivered",
]
const DELIVERED_STATUSES = ["delivered"]

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + item.quantity
      }, 0) ?? 0
    )
  }, [order])

  const status = order.fulfillment_status
  const litSteps = [
    true,
    PACKED_STATUSES.includes(status),
    SHIPPED_STATUSES.includes(status),
    DELIVERED_STATUSES.includes(status),
  ]

  return (
    <div className="card" style={{ marginBottom: 16 }} data-testid="order-card">
      <div className="row-between">
        <div>
          <h3>
            Order #
            <span data-testid="order-display-id">{order.display_id}</span>
          </h3>
          <p className="meta" data-testid="order-created-at">
            {new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            · {numberOfLines} {numberOfLines === 1 ? "item" : "items"}
          </p>
        </div>
        <span className="price num" data-testid="order-amount">
          {convertToLocale({
            amount: order.total,
            currency_code: order.currency_code,
          })}
        </span>
      </div>

      <div className="row" style={{ marginTop: 18, gap: 0 }}>
        {TRACK_STEPS.map((step, i) => (
          <div key={step} style={{ flex: 1, textAlign: "center", position: "relative" }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                margin: "0 auto 6px",
                background: litSteps[i] ? "var(--green-deep)" : "var(--border)",
              }}
            />
            <span className="meta" style={{ fontSize: 11 }}>
              {step}
            </span>
            {i < TRACK_STEPS.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  top: 5,
                  left: "56%",
                  width: "88%",
                  height: 2,
                  background: "var(--border)",
                }}
              />
            )}
          </div>
        ))}
      </div>
      <p className="field-hint" style={{ marginTop: 14 }}>
        Tracking updates here as your order moves.
      </p>

      <div className="row-between" style={{ marginTop: 18 }}>
        <span />
        <LocalizedClientLink
          href={`/account/orders/details/${order.id}`}
          className="btn btn-secondary btn-sm"
          data-testid="order-details-link"
        >
          View details
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderCard
