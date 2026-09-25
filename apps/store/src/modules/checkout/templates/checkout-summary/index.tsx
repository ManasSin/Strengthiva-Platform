import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import { HttpTypes } from "@medusajs/types"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  return (
    <aside className="panel legacy-scope" style={{ position: "sticky", top: 96 }}>
      <h3 style={{ marginBottom: 16 }}>Order summary</h3>
      <ItemsPreviewTemplate cart={cart} />
      <hr className="rule" style={{ margin: "14px 0" }} />
      <CartTotals totals={cart} />
      <div style={{ marginTop: 20 }}>
        <DiscountCode cart={cart} />
      </div>
      <p className="field-hint" style={{ marginTop: 10 }}>
        Final shipping is confirmed once your address and delivery option are
        set.
      </p>
    </aside>
  )
}

export default CheckoutSummary
