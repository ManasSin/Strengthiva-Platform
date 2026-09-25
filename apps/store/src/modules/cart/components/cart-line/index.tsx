"use client"

import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { formFromText, formatPrice } from "@lib/util/store-catalog"
import { HttpTypes } from "@medusajs/types"
import { ProductVisual } from "@modules/common/components/bottle"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState } from "react"

/*
  One cart row (store.js → renderCartDrawer / cart.html → renderPage), on the
  real Medusa line item. Quantity and remove go through the existing server
  actions, whose revalidateTag re-renders the cart everywhere it is shown.
*/
export default function CartLine({
  item,
  currencyCode,
  size = 64,
}: {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  size?: number
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const name = item.product_title ?? item.title ?? ""
  const form = formFromText(name, item.variant_title)
  const unit = item.unit_price ?? 0
  const lineTotal = item.subtotal ?? unit * item.quantity

  const run = async (action: () => Promise<unknown>) => {
    setError(null)
    setPending(true)
    try {
      await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update your cart")
    } finally {
      setPending(false)
    }
  }

  const setQty = (qty: number) =>
    run(() =>
      qty <= 0
        ? deleteLineItem(item.id)
        : updateLineItem({ lineId: item.id, quantity: qty })
    )

  return (
    <div
      className="cart-line"
      style={{ gridTemplateColumns: `${size}px 1fr auto`, opacity: pending ? 0.6 : 1 }}
      data-testid="cart-item"
    >
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className="product-media"
        style={{ width: size, height: size, borderRadius: "var(--r-sm)" }}
        aria-label={name}
      >
        <ProductVisual thumbnail={item.thumbnail ?? null} form={form} name={name} padding="6px" />
      </LocalizedClientLink>
      <div>
        <LocalizedClientLink href={`/products/${item.product_handle}`}>
          <div className="name" data-testid="product-title">
            {name}
          </div>
        </LocalizedClientLink>
        <div className="variant">
          {formatPrice(unit, currencyCode)} each
          {item.variant_title ? ` · ${item.variant_title}` : ""}
        </div>
        <div className="line-foot">
          <span className="qty">
            <button
              aria-label="Decrease quantity"
              disabled={pending}
              onClick={() => setQty(item.quantity - 1)}
            >
              −
            </button>
            <input value={item.quantity} readOnly aria-label="Quantity" data-testid="cart-item-quantity" />
            <button
              aria-label="Increase quantity"
              disabled={pending}
              onClick={() => setQty(item.quantity + 1)}
            >
              +
            </button>
          </span>
          <button
            className="remove"
            disabled={pending}
            onClick={() => setQty(0)}
            data-testid="cart-item-remove-button"
          >
            Remove
          </button>
        </div>
        {error && (
          <p className="field-error" style={{ marginTop: 6 }}>
            {error}
          </p>
        )}
      </div>
      <span className="price num">{formatPrice(lineTotal, currencyCode)}</span>
    </div>
  )
}
