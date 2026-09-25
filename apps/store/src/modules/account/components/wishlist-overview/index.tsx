"use client"

import { useStoreUI } from "@lib/context/store-ui"
import { CardProduct } from "@lib/util/store-catalog"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HeartIcon } from "@modules/common/components/store-icons"
import { ProductGrid } from "@modules/products/components/product-card"

const WishlistOverview = ({ cards }: { cards: CardProduct[] }) => {
  const { wishlist } = useStoreUI()
  const wishedCards = cards.filter((c) => wishlist.includes(c.id))

  if (!wishedCards.length) {
    return (
      <div className="empty-state" data-testid="wishlist-page-wrapper">
        <div className="mark">
          <HeartIcon width={22} height={22} strokeWidth={1.6} />
        </div>
        <h3>Nothing saved yet</h3>
        <p className="lead center" style={{ margin: "8px auto 0" }}>
          Tap the heart on any product to save it here.
        </p>
        <LocalizedClientLink href="/store" className="btn btn-primary" style={{ marginTop: 18 }}>
          Browse products
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div data-testid="wishlist-page-wrapper">
      <ProductGrid products={wishedCards} id="wishlistGrid" />
    </div>
  )
}

export default WishlistOverview
