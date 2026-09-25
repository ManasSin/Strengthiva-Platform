"use client"

import { clx } from "@modules/common/components/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 && cart?.total === 0
  )

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div className="panel">
      <div className="row-between" style={{ marginBottom: isOpen ? 16 : 0 }}>
        <h3
          className={clx({
            "opacity-50 pointer-events-none select-none": !isOpen,
          })}
        >
          Review
        </h3>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          <p className="field-hint" style={{ marginBottom: 16 }}>
            By clicking the Place Order button, you confirm that you have
            read, understand and accept our Terms of Use, Terms of Sale and
            Returns Policy and acknowledge that you have read Medusa
            Store&apos;s Privacy Policy.
          </p>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      )}
    </div>
  )
}

export default Review
