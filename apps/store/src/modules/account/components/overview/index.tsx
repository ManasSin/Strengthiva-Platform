"use client"

import { useStoreUI } from "@lib/context/store-ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ orders }: OverviewProps) => {
  const { wishlist } = useStoreUI()

  return (
    <div data-testid="overview-page-wrapper">
      <div className="grid-3">
        <div className="card">
          <p className="eyebrow">Orders</p>
          <p
            className="stat-num"
            style={{ fontSize: 36 }}
            data-testid="orders-count"
            data-value={orders?.length ?? 0}
          >
            {orders?.length ?? 0}
          </p>
          <p className="meta">Total orders placed</p>
        </div>
        <div className="card">
          <p className="eyebrow">Wishlist</p>
          <p
            className="stat-num"
            style={{ fontSize: 36 }}
            data-testid="wishlist-count"
            data-value={wishlist.length}
          >
            {wishlist.length}
          </p>
          <p className="meta">Products saved for later</p>
        </div>
        <div className="card">
          <p className="eyebrow">Personalization</p>
          <p style={{ fontSize: 15, marginTop: 6 }}>
            You haven&apos;t taken the assessment yet.
          </p>
          <LocalizedClientLink
            href="/personalized"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 12 }}
          >
            Take the assessment
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

export default Overview
