"use client"

import { CardProduct, CategoryTile } from "@lib/util/store-catalog"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ProductGrid } from "@modules/products/components/product-card"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

/*
  search.html from the handoff. The query lives in ?q=, which the header's
  search box rewrites as you type on this page, so results update live. The
  match is the prototype's: product name, category name, or tagline.
*/
const POPULAR = ["Tulsi", "Digestion", "Joint pain", "Stress", "Immunity"]

export default function SearchView({
  products,
  categories,
}: {
  products: CardProduct[]
  categories: CategoryTile[]
}) {
  const query = useSearchParams().get("q") ?? ""
  const ql = query.trim().toLowerCase()

  // Concern phrasing ("Digestion", "Stress") lives on the category, so a query
  // that matches a category's concern label pulls in that category's products.
  const concernHandles = new Set(
    categories.filter((c) => ql && c.concernLabel.toLowerCase().includes(ql)).map((c) => c.handle)
  )
  const matches = ql
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(ql) ||
          (p.categoryLabel ?? "").toLowerCase().includes(ql) ||
          p.blurb.toLowerCase().includes(ql) ||
          (p.categoryHandle != null && concernHandles.has(p.categoryHandle))
      )
    : []

  useEffect(() => {
    document.title = ql ? `“${query}” — Search — Strengthiva` : "Search — Strengthiva"
  }, [ql, query])

  return (
    <>
      {/* One section: a compact result line straight above the grid, not the
          handoff's eyebrow + big heading + rule + empty band. */}
      <section className="section" style={{ paddingTop: 16 }}>
        <div className="container">
          <h1 className="visually-hidden">{ql ? `Search results for “${query}”` : "Search Strengthiva"}</h1>
          <p className="meta" style={{ marginBottom: 22 }}>
            {ql
              ? `${matches.length} result${matches.length === 1 ? "" : "s"} for “${query}”`
              : "Try a product name, an ingredient like tulsi or ashwagandha, or a concern like digestion."}
          </p>
          {ql && (
            <ProductGrid
              products={matches}
              emptyTitle="No products match that search"
              emptyBody="Try a different spelling, or one of the searches below."
            />
          )}
          {!matches.length && (
            <div style={{ marginTop: ql ? 48 : 0 }}>
              <p className="eyebrow">Popular searches</p>
              <div className="row" style={{ flexWrap: "wrap", gap: 10 }}>
                {POPULAR.map((s) => (
                  <LocalizedClientLink key={s} className="tag" href={`/search?q=${encodeURIComponent(s)}`}>
                    {s}
                  </LocalizedClientLink>
                ))}
              </div>
              <div style={{ marginTop: 32 }}>
                <p className="eyebrow">Or browse a category</p>
                <div className="grid-4" style={{ marginTop: 14 }}>
                  {categories.slice(0, 4).map((c) => (
                    <LocalizedClientLink key={c.id} className="cat-tile" href={`/categories/${c.handle}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- decorative */}
                      <img src={c.image} alt="" loading="lazy" />
                      <div className="cat-tile-label">
                        <h3 className="h3">{c.label}</h3>
                      </div>
                    </LocalizedClientLink>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
