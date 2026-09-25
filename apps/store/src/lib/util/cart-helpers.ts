import { HttpTypes } from "@medusajs/types"

export function cartItemCount(cart?: HttpTypes.StoreCart | null) {
  return cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0
}

/** Same rule the old Medusa cart summary used to pick the first checkout step. */
export function checkoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) return "address"
  if (cart?.shipping_methods?.length === 0) return "delivery"
  return "payment"
}

/** Items-only subtotal (before shipping/tax), summed from the lines themselves. */
export function cartItemsSubtotal(cart?: HttpTypes.StoreCart | null) {
  return (
    cart?.items?.reduce(
      (sum, i) => sum + (i.subtotal ?? (i.unit_price ?? 0) * i.quantity),
      0
    ) ?? 0
  )
}
