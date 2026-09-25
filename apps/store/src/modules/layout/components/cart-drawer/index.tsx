"use client"

import { useStoreUI } from "@lib/context/store-ui"
import { formatPrice } from "@lib/util/store-catalog"
import { HttpTypes } from "@medusajs/types"
import CartLine from "@modules/cart/components/cart-line"
import { cartItemsSubtotal, checkoutStep } from "@lib/util/cart-helpers"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CartEmptyIcon, CloseIcon } from "@modules/common/components/store-icons"

/* The slide-over cart from every handoff page (#cartDrawer). */
export default function CartDrawer({ cart }: { cart: HttpTypes.StoreCart | null }) {
  const { cartOpen, closeCart } = useStoreUI()
  const items = [...(cart?.items ?? [])].sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  )
  const currency = cart?.currency_code ?? "inr"
  const subtotal = cartItemsSubtotal(cart)

  return (
    <div
      className={`cart-drawer${cartOpen ? " open" : ""}`}
      id="cartDrawer"
      aria-hidden={!cartOpen}
      data-testid="nav-cart-dropdown"
    >
      <div className="scrim" onClick={closeCart} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Your cart">
        <div className="cart-drawer-head">
          <h3>Your cart</h3>
          <button className="icon-btn" onClick={closeCart} aria-label="Close cart">
            <CloseIcon />
          </button>
        </div>
        <div className="cart-drawer-body">
          {items.length ? (
            items.map((item) => (
              <CartLine key={item.id} item={item} currencyCode={currency} />
            ))
          ) : (
            <div className="empty-state">
              <div className="mark">
                <CartEmptyIcon width={22} height={22} />
              </div>
              <h3>Your cart is empty</h3>
              <p className="lead center" style={{ margin: "8px auto 0" }}>
                Start with a category or a wellness concern.
              </p>
              <LocalizedClientLink
                href="/store"
                className="btn btn-primary"
                style={{ marginTop: 18 }}
                onClick={closeCart}
              >
                Shop all products
              </LocalizedClientLink>
            </div>
          )}
        </div>
        {cart && items.length > 0 && (
          <div className="cart-drawer-foot">
            <div className="row-between" style={{ marginBottom: 14 }}>
              <span className="muted">Subtotal</span>
              <span className="price num" data-testid="cart-subtotal">
                {formatPrice(subtotal, currency)}
              </span>
            </div>
            <p className="field-hint" style={{ marginBottom: 14 }}>
              Shipping and any applicable taxes are calculated at checkout.
            </p>
            <LocalizedClientLink
              href={`/checkout?step=${checkoutStep(cart)}`}
              className="btn btn-primary btn-block"
              onClick={closeCart}
              data-testid="checkout-button"
            >
              Checkout · {formatPrice(subtotal, currency)}
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/cart"
              className="btn btn-ghost btn-block"
              style={{ marginTop: 8 }}
              onClick={closeCart}
              data-testid="go-to-cart-button"
            >
              View full cart
            </LocalizedClientLink>
          </div>
        )}
      </div>
    </div>
  )
}
