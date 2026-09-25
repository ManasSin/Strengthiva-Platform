import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const getAmount = (amount?: number | null) => {
    if (!amount) {
      return
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ marginBottom: 12 }}>Order summary</h3>
      <div className="row-between" style={{ marginBottom: 8 }}>
        <span className="muted">Subtotal</span>
        <span className="num">{getAmount(order.subtotal)}</span>
      </div>
      {order.discount_total > 0 && (
        <div className="row-between" style={{ marginBottom: 8 }}>
          <span className="muted">Discount</span>
          <span className="num">- {getAmount(order.discount_total)}</span>
        </div>
      )}
      {order.gift_card_total > 0 && (
        <div className="row-between" style={{ marginBottom: 8 }}>
          <span className="muted">Discount</span>
          <span className="num">- {getAmount(order.gift_card_total)}</span>
        </div>
      )}
      <div className="row-between" style={{ marginBottom: 8 }}>
        <span className="muted">Shipping</span>
        <span className="num">{getAmount(order.shipping_total)}</span>
      </div>
      <div className="row-between" style={{ marginBottom: 8 }}>
        <span className="muted">Taxes</span>
        <span className="num">{getAmount(order.tax_total)}</span>
      </div>
      <hr className="rule" style={{ margin: "14px 0" }} />
      <div className="row-between">
        <strong>Total</strong>
        <strong className="num">{getAmount(order.total)}</strong>
      </div>
    </div>
  )
}

export default OrderSummary
