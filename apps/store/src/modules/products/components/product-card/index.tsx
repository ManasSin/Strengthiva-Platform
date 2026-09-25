"use client"

import { useStoreUI } from "@lib/context/store-ui"
import { CardProduct, formatPrice } from "@lib/util/store-catalog"
import { ProductVisual } from "@modules/common/components/bottle"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HeartIcon, PlusIcon, SearchIcon } from "@modules/common/components/store-icons"
import { useRouter, useParams } from "next/navigation"
import { useState } from "react"

/* store.js → productCardHTML, fed by Medusa. */
export default function ProductCard({ product: p }: { product: CardProduct }) {
  const { addItems, isWished, toggleWish } = useStoreUI()
  const router = useRouter()
  const { countryCode } = useParams() as { countryCode: string }
  const [adding, setAdding] = useState(false)
  const out = !p.inStock
  const href = `/products/${p.handle}`
  const wished = isWished(p.id)

  const onAdd = async () => {
    if (out) return
    // Multi-variant products need a pack-size choice first — send them to the PDP.
    if (!p.variantId) {
      router.push(`/${countryCode}${href}`)
      return
    }
    setAdding(true)
    await addItems([{ variantId: p.variantId }], p.title)
    setAdding(false)
  }

  return (
    <article className="product-card" data-testid="product-wrapper">
      <LocalizedClientLink href={href} className="product-media" aria-label={p.title}>
        {out && <span className="badge badge-out">Out of stock</span>}
        <ProductVisual thumbnail={p.thumbnail} form={p.form} name={p.title} />
      </LocalizedClientLink>
      <button
        className="product-wish"
        aria-label={`${wished ? "Remove" : "Save"} ${p.title} ${wished ? "from" : "to"} wishlist`}
        aria-pressed={wished}
        onClick={() => toggleWish(p.id)}
        style={wished ? { color: "var(--danger)" } : undefined}
      >
        <HeartIcon fill={wished ? "currentColor" : "none"} />
      </button>
      {p.categoryLabel && (
        <div>
          <span className={`cat-chip cc-${p.colorIndex}`}>{p.categoryLabel}</span>
        </div>
      )}
      <LocalizedClientLink href={href}>
        <h3 className="product-name" data-testid="product-title">
          {p.title}
        </h3>
      </LocalizedClientLink>
      {p.blurb && <p className="product-desc">{p.blurb}</p>}
      <div className="product-bottom">
        <span className="price num">{formatPrice(p.price, p.currencyCode)}</span>
        <button
          className="add-btn"
          disabled={out || adding}
          aria-busy={adding}
          aria-label={`Add ${p.title} to cart`}
          onClick={onAdd}
        >
          <PlusIcon />
        </button>
      </div>
    </article>
  )
}

/* store.js → renderGrid, including its empty state. */
export function ProductGrid({
  products,
  id,
  emptyTitle = "No products match those filters",
  emptyBody = "Try removing a filter, or browse the full Strengthiva range.",
}: {
  products: CardProduct[]
  id?: string
  emptyTitle?: string
  emptyBody?: string
}) {
  return (
    <div className="pgrid" id={id} data-testid="products-list">
      {products.length ? (
        products.map((p) => <ProductCard key={p.id} product={p} />)
      ) : (
        <div className="empty-state" style={{ gridColumn: "1/-1" }}>
          <div className="mark">
            <SearchIcon width={22} height={22} strokeWidth={1.6} />
          </div>
          <h3>{emptyTitle}</h3>
          <p className="lead center" style={{ margin: "8px auto 0" }}>
            {emptyBody}
          </p>
          <LocalizedClientLink href="/store" className="btn btn-secondary" style={{ marginTop: 18 }}>
            Shop all products
          </LocalizedClientLink>
        </div>
      )}
    </div>
  )
}
