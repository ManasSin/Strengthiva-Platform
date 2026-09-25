import { cartItemsSubtotal, checkoutStep } from "@lib/util/cart-helpers"
import { CardProduct, formatPrice } from "@lib/util/store-catalog"
import { HttpTypes } from "@medusajs/types"
import CartLine from "@modules/cart/components/cart-line"
import PromoCode from "@modules/cart/components/promo-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CartEmptyIcon } from "@modules/common/components/store-icons"
import { ProductGrid } from "@modules/products/components/product-card"

/* Cart page — cart.html from the "store redesign 02" handoff. */
const CartTemplate = ({
  cart,
  customer,
  upsell,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  upsell: CardProduct[]
}) => {
  const items = [...(cart?.items ?? [])].sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  )
  const currency = cart?.currency_code ?? "inr"
  const subtotal = cartItemsSubtotal(cart)
  const discount = cart?.discount_total ?? 0
  const inCart = new Set(items.map((i) => i.product_id))
  const suggestions = upsell.filter((p) => !inCart.has(p.id)).slice(0, 4)

  return (
    <section className="section" data-testid="cart-container">
      <div className="container">
        <h1 className="h2" style={{ marginBottom: 32 }}>
          Your Cart
        </h1>
        {!cart || !items.length ? (
          <div className="empty-state" data-testid="empty-cart-message">
            <div className="mark">
              <CartEmptyIcon width={22} height={22} />
            </div>
            <h3>Your cart is empty</h3>
            <p className="lead center" style={{ margin: "8px auto 0" }}>
              Browse the full range or start with a wellness concern.
            </p>
            <LocalizedClientLink href="/store" className="btn btn-primary" style={{ marginTop: 18 }}>
              Shop all products
            </LocalizedClientLink>
          </div>
        ) : (
          <div className="grid-2-1">
            <div>
              <div>
                {items.map((item) => (
                  <CartLine key={item.id} item={item} currencyCode={currency} size={84} />
                ))}
              </div>
              {suggestions.length > 0 && (
                <div style={{ marginTop: 28 }}>
                  <p className="eyebrow">You might also add</p>
                  <div style={{ marginTop: 14 }}>
                    <ProductGrid products={suggestions} />
                  </div>
                </div>
              )}
            </div>
            <aside className="panel" style={{ position: "sticky", top: 96 }}>
              <h3 style={{ marginBottom: 16 }}>Order summary</h3>
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span className="muted">Subtotal</span>
                <span className="num" data-testid="cart-subtotal">
                  {formatPrice(subtotal, currency)}
                </span>
              </div>
              {discount > 0 && (
                <div className="row-between" style={{ marginBottom: 10 }}>
                  <span className="muted">Discount</span>
                  <span className="num" data-testid="cart-discount">
                    −{formatPrice(discount, currency)}
                  </span>
                </div>
              )}
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span className="muted">Shipping</span>
                <span className="num muted">Calculated at checkout</span>
              </div>
              <hr className="rule" style={{ margin: "14px 0" }} />
              <div className="row-between" style={{ marginBottom: 20 }}>
                <strong>Estimated total</strong>
                <strong className="num" data-testid="cart-total">
                  {formatPrice(Math.max(0, subtotal - discount), currency)}
                </strong>
              </div>
              <LocalizedClientLink
                href={`/checkout?step=${checkoutStep(cart)}`}
                className="btn btn-primary btn-block"
                data-testid="checkout-button"
              >
                Proceed to checkout
              </LocalizedClientLink>
              <PromoCode cart={cart} />
              {!customer && (
                <p className="field-hint" style={{ marginTop: 12 }} data-testid="sign-in-prompt">
                  Have an account?{" "}
                  <LocalizedClientLink href="/account" style={{ textDecoration: "underline" }} data-testid="sign-in-button">
                    Sign in
                  </LocalizedClientLink>{" "}
                  for a faster checkout.
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}

export default CartTemplate
