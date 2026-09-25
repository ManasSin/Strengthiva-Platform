"use client"

import { CardProduct, CategoryTile, FORM_LABELS, ProductForm } from "@lib/util/store-catalog"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CloseIcon, FilterIcon } from "@modules/common/components/store-icons"
import { ProductGrid } from "@modules/products/components/product-card"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

/*
  collection.html from the "store redesign 02" handoff: breadcrumb + heading,
  a toolbar (Filters / count / sort), active-filter chips, a sticky facet
  column on desktop and a slide-in filter drawer on mobile.

  Filtering runs on the client over the full catalog the page was rendered
  with (see getCatalog), as in the prototype, so every facet is instant.
  Choosing a category rewrites the URL to /categories/<handle> (or /store) with
  history.replaceState — shareable, without a server round-trip.
*/

type Sort = "created_at" | "price_asc" | "price_desc"

const PRICE_BANDS = [
  { id: "u200", label: "Under ₹200", test: (p: number) => p < 200 },
  { id: "200-250", label: "₹200 – ₹250", test: (p: number) => p >= 200 && p <= 250 },
  { id: "a250", label: "Above ₹250", test: (p: number) => p > 250 },
]

export default function CollectionView({
  products,
  categories,
  initialCategory = "all",
  initialSort = "created_at",
  fixedTitle,
  fixedIntro,
}: {
  products: CardProduct[]
  categories: CategoryTile[]
  initialCategory?: string
  initialSort?: Sort
  /** Collections pages have their own title and don't switch category in the URL. */
  fixedTitle?: string
  fixedIntro?: string
}) {
  const { countryCode } = useParams() as { countryCode: string }
  const [cat, setCatState] = useState(initialCategory)
  const [types, setTypes] = useState<ProductForm[]>([])
  const [prices, setPrices] = useState<string[]>([])
  const [inStock, setInStock] = useState(false)
  const [sort, setSort] = useState<Sort>(initialSort)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const category = categories.find((c) => c.handle === cat) ?? null

  const setCat = (handle: string) => {
    setCatState(handle)
    if (fixedTitle) return
    const path = handle === "all" ? `/${countryCode}/store` : `/${countryCode}/categories/${handle}`
    window.history.replaceState(null, "", path + window.location.search)
  }

  const list = useMemo(() => {
    let l = products.slice()
    if (cat !== "all") l = l.filter((p) => p.categoryHandle === cat)
    if (types.length) l = l.filter((p) => types.includes(p.form))
    if (prices.length)
      l = l.filter(
        (p) =>
          p.price != null &&
          prices.some((id) => PRICE_BANDS.find((b) => b.id === id)!.test(p.price!))
      )
    if (inStock) l = l.filter((p) => p.inStock)
    if (sort === "price_asc") l.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    if (sort === "price_desc") l.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    if (sort === "created_at")
      l.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    return l
  }, [products, cat, types, prices, inStock, sort])

  const title = fixedTitle ?? (category ? category.label : "Shop All Products")
  const intro =
    fixedIntro ??
    (category
      ? `${category.blurb} ${list.length} formulation${list.length === 1 ? "" : "s"} currently listed in this range.`
      : `${products.length} classical formulations. No fillers.`)

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [drawerOpen])

  useEffect(() => {
    if (!fixedTitle) {
      document.title = `${category ? category.label : "Shop All"} — Strengthiva`
    }
  }, [category, fixedTitle])

  const typeSet = Array.from(new Set(products.map((p) => p.form)))

  const toggle = <T,>(arr: T[], v: T, on: boolean) =>
    on ? [...arr, v] : arr.filter((x) => x !== v)

  const chips: { label: string; clear: () => void }[] = []
  if (category && !fixedTitle) chips.push({ label: category.label, clear: () => setCat("all") })
  types.forEach((t) =>
    chips.push({ label: FORM_LABELS[t], clear: () => setTypes((s) => s.filter((x) => x !== t)) })
  )
  prices.forEach((id) =>
    chips.push({
      label: PRICE_BANDS.find((b) => b.id === id)!.label,
      clear: () => setPrices((s) => s.filter((x) => x !== id)),
    })
  )

  const facets = (suffix: string) => (
    <>
      {!fixedTitle && (
        <div className="facet-group" style={{ borderTop: 0, paddingTop: suffix === "d" ? 0 : undefined }}>
          <p className="h3" style={{ fontSize: 14, marginBottom: 12 }}>
            Category
          </p>
          <div>
            <FacetRow
              type="radio"
              name={`cat-${suffix}`}
              id={`cat-all-${suffix}`}
              label="All categories"
              checked={cat === "all"}
              onChange={() => setCat("all")}
            />
            {categories.map((c) => (
              <FacetRow
                key={c.id}
                type="radio"
                name={`cat-${suffix}`}
                id={`cat-${c.handle}-${suffix}`}
                label={c.label}
                checked={cat === c.handle}
                onChange={() => setCat(c.handle)}
              />
            ))}
          </div>
        </div>
      )}
      <div className="facet-group" style={fixedTitle ? { borderTop: 0, paddingTop: 0 } : undefined}>
        <p className="h3" style={{ fontSize: 14, marginBottom: 12 }}>
          Product type
        </p>
        {typeSet.map((t) => (
          <FacetRow
            key={t}
            type="checkbox"
            id={`type-${t}-${suffix}`}
            label={FORM_LABELS[t]}
            checked={types.includes(t)}
            onChange={(on) => setTypes((s) => toggle(s, t, on))}
          />
        ))}
      </div>
      <div className="facet-group">
        <p className="h3" style={{ fontSize: 14, marginBottom: 12 }}>
          Price
        </p>
        {PRICE_BANDS.map((b) => (
          <FacetRow
            key={b.id}
            type="checkbox"
            id={`price-${b.id}-${suffix}`}
            label={b.label}
            checked={prices.includes(b.id)}
            onChange={(on) => setPrices((s) => toggle(s, b.id, on))}
          />
        ))}
      </div>
      <div className="facet-group">
        {suffix === "d" && (
          <p className="h3" style={{ fontSize: 14, marginBottom: 12 }}>
            Availability
          </p>
        )}
        <FacetRow
          type="checkbox"
          id={`instock-${suffix}`}
          label="In stock only"
          checked={inStock}
          onChange={setInStock}
        />
      </div>
    </>
  )

  return (
    <>
      <section className="section pt-0" style={{ paddingBottom: 0 }}>
        <div className="container">
          <nav className="crumbs" style={{ marginBottom: 18 }} aria-label="Breadcrumb">
            <LocalizedClientLink href="/">Home</LocalizedClientLink>
            <span className="sep">/</span>
            <span>{fixedTitle ?? (category ? category.label : "Shop All")}</span>
          </nav>
          <div className="collection-head">
            <div>
              <h1 className="h2" data-testid="store-page-title">
                {title}
              </h1>
              <p className="lead" style={{ marginTop: 8 }}>
                {intro}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" data-testid="category-container">
        <div className="container">
          <div className="toolbar">
            <div className="row" style={{ flexWrap: "wrap" }}>
              <button className="filter-chip" onClick={() => setDrawerOpen(true)}>
                <FilterIcon />
                Filters
              </button>
              <span className="meta">
                {list.length} {list.length === 1 ? "product" : "products"}
              </span>
            </div>
            <div className="row">
              <label className="visually-hidden" htmlFor="sortSelect">
                Sort
              </label>
              <select
                className="select-native"
                id="sortSelect"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                data-testid="sort-by-container"
              >
                <option value="created_at">Latest Arrivals</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </select>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="active-filters" style={{ marginBottom: 22 }}>
              {chips.map((ch) => (
                <span className="filter-chip" key={ch.label}>
                  {ch.label}{" "}
                  <button aria-label={`Remove filter ${ch.label}`} style={{ width: 12, height: 12 }} onClick={ch.clear}>
                    <CloseIcon strokeWidth={2} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="collection-layout">
            <aside style={{ position: "sticky", top: 96 }} className="hide-on-mobile">
              {facets("d")}
            </aside>
            <div>
              <ProductGrid products={list} />
            </div>
          </div>
        </div>
      </section>

      <div className={`filter-drawer${drawerOpen ? " open" : ""}`} aria-hidden={!drawerOpen}>
        <div className="scrim" onClick={() => setDrawerOpen(false)} />
        <div className="sheet" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <h3>Filters</h3>
            <button className="icon-btn" onClick={() => setDrawerOpen(false)} aria-label="Close filters">
              <CloseIcon />
            </button>
          </div>
          {facets("m")}
          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setDrawerOpen(false)}>
            View results
          </button>
        </div>
      </div>
    </>
  )
}

function FacetRow({
  type,
  id,
  name,
  label,
  checked,
  onChange,
}: {
  type: "radio" | "checkbox"
  id: string
  name?: string
  label: string
  checked: boolean
  onChange: (on: boolean) => void
}) {
  return (
    <div className="facet-row">
      <input
        type={type}
        id={id}
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  )
}
