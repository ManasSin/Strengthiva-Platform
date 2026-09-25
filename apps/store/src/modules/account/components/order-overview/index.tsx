"use client"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div data-testid="orders-list">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    )
  }

  return (
    <div className="empty-state" data-testid="no-orders-container">
      <div className="mark">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M20 7L9 18l-5-5" />
        </svg>
      </div>
      <h3>No orders yet</h3>
      <p className="lead center" style={{ margin: "8px auto 0" }}>
        Orders you place will appear here with tracking.
      </p>
      <LocalizedClientLink
        href="/store"
        className="btn btn-primary"
        style={{ marginTop: 18 }}
        data-testid="continue-shopping-button"
      >
        Shop all products
      </LocalizedClientLink>
    </div>
  )
}

export default OrderOverview
