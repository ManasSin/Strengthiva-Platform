"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
  }
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 8 }}>
        <span className="muted">Subtotal (excl. shipping and taxes)</span>
        <span className="num" data-testid="cart-subtotal" data-value={item_subtotal || 0}>
          {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
        </span>
      </div>
      <div className="row-between" style={{ marginBottom: 8 }}>
        <span className="muted">Shipping</span>
        <span className="num" data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
          {convertToLocale({ amount: shipping_subtotal ?? 0, currency_code })}
        </span>
      </div>
      {!!discount_subtotal && (
        <div className="row-between" style={{ marginBottom: 8 }}>
          <span className="muted">Discount</span>
          <span
            className="num"
            style={{ color: "var(--green-deep)" }}
            data-testid="cart-discount"
            data-value={discount_subtotal || 0}
          >
            -{" "}
            {convertToLocale({
              amount: discount_subtotal ?? 0,
              currency_code,
            })}
          </span>
        </div>
      )}
      <div className="row-between" style={{ marginBottom: 8 }}>
        <span className="muted">Taxes</span>
        <span className="num" data-testid="cart-taxes" data-value={tax_total || 0}>
          {convertToLocale({ amount: tax_total ?? 0, currency_code })}
        </span>
      </div>
      <hr className="rule" style={{ margin: "14px 0" }} />
      <div className="row-between">
        <strong>Total</strong>
        <strong className="num" data-testid="cart-total" data-value={total || 0}>
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </strong>
      </div>
    </div>
  )
}

export default CartTotals
