"use client"

import { CardProduct, CategoryTile, formatPrice } from "@lib/util/store-catalog"
import { ProductVisual } from "@modules/common/components/bottle"
import { SearchIcon } from "@modules/common/components/store-icons"
import Link from "next/link"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

/*
  The header's predictive search (store.js → runSearch). Matches product names
  and category / concern labels on the catalog the Nav already loaded, so the
  panel opens without a network round-trip. Enter, or "See all results", goes
  to /search, which runs the same match over the full catalog. On /search
  itself, typing drives that page's results live (search.html's liveResults).
*/
export default function HeaderSearch({
  products,
  categories,
}: {
  products: CardProduct[]
  categories: CategoryTile[]
}) {
  const { countryCode } = useParams() as { countryCode: string }
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const onSearchPage = pathname === `/${countryCode}/search`
  const [value, setValue] = useState(onSearchPage ? searchParams.get("q") ?? "" : "")
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const base = `/${countryCode}`

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("click", onDoc)
    return () => document.removeEventListener("click", onDoc)
  }, [])

  // Close the panel on navigation.
  useEffect(() => setOpen(false), [pathname])

  const q = value.trim().toLowerCase()
  const prodMatches =
    q.length >= 2 ? products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 5) : []
  const catMatches =
    q.length >= 2
      ? categories
          .filter(
            (c) =>
              c.label.toLowerCase().includes(q) || c.concernLabel.toLowerCase().includes(q)
          )
          .slice(0, 3)
      : []

  const onChange = (v: string) => {
    setValue(v)
    setOpen(v.trim().length >= 2)
    if (onSearchPage) {
      const params = new URLSearchParams()
      if (v.trim()) params.set("q", v)
      router.replace(`${base}/search${params.size ? `?${params}` : ""}`, { scroll: false })
    }
  }

  const submit = () => {
    if (!value.trim()) return
    setOpen(false)
    router.push(`${base}/search?q=${encodeURIComponent(value)}`)
  }

  return (
    <div className="search-wrap" ref={wrapRef}>
      <SearchIcon className="search-icon" />
      <input
        className="search-input"
        type="search"
        placeholder="Search products, ingredients, concerns…"
        aria-label="Search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(value.trim().length >= 2)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit()
        }}
        data-testid="store-search-input"
      />
      <div className={`search-panel${open ? " open" : ""}`}>
        {!prodMatches.length && !catMatches.length ? (
          <div className="search-row">
            <span className="name muted">
              No matches for &ldquo;{value}&rdquo;. Try an ingredient like &ldquo;Tulsi&rdquo; or
              a concern like &ldquo;Digestion&rdquo;.
            </span>
          </div>
        ) : (
          <>
            {catMatches.length > 0 && (
              <>
                <div className="search-group-label">Collections</div>
                {catMatches.map((c) => (
                  <Link key={c.id} className="search-row" href={`${base}/categories/${c.handle}`}>
                    <span className="name">{c.label}</span>
                    <span className="cat">Shop the range →</span>
                  </Link>
                ))}
              </>
            )}
            {prodMatches.length > 0 && (
              <>
                <div className="search-group-label">Products</div>
                {prodMatches.map((p) => (
                  <Link key={p.id} className="search-row" href={`${base}/products/${p.handle}`}>
                    <span
                      className="product-media"
                      style={{ width: 40, height: 40, borderRadius: 6, flex: "none" }}
                    >
                      <ProductVisual thumbnail={p.thumbnail} form={p.form} name={p.title} padding="4px" />
                    </span>
                    <span className="name">{p.title}</span>
                    <span className="price num">{formatPrice(p.price, p.currencyCode)}</span>
                  </Link>
                ))}
              </>
            )}
          </>
        )}
        <div
          className="search-group-label"
          style={{ paddingTop: 10, borderTop: "1px solid var(--border)", marginTop: 4 }}
        />
        <Link className="search-row" href={`${base}/search?q=${encodeURIComponent(value)}`}>
          <span className="name">See all results for &ldquo;{value}&rdquo; →</span>
        </Link>
      </div>
    </div>
  )
}
