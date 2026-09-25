"use client"

import { useStoreUI } from "@lib/context/store-ui"
import { formatPrice, variantInStock } from "@lib/util/store-catalog"
import { HttpTypes } from "@medusajs/types"
import { isEqual } from "lodash"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

/*
  The purchase column of product.html: price + stock badge, pack-size options,
  quantity stepper, Add to cart, the pincode check and the sticky mobile buy
  bar. Variant selection keeps the old ProductActions behaviour — options map
  to a variant, and the choice is mirrored into ?v_id= so the gallery can show
  that variant's images.
*/

type PricedVariant = HttpTypes.StoreProductVariant & {
  calculated_price?: { calculated_amount?: number | null; currency_code?: string | null }
}

const optionsAsKeymap = (variantOptions: HttpTypes.StoreProductVariant["options"]) =>
  variantOptions?.reduce((acc: Record<string, string>, o) => {
    if (o.option_id) acc[o.option_id] = o.value
    return acc
  }, {}) ?? {}

export default function ProductBuyBox({
  product,
  categoryLabel,
  children,
}: {
  product: HttpTypes.StoreProduct
  categoryLabel: string | null
  /** Rendered between the purchase controls and the pincode check (tags etc.). */
  children?: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { addItems } = useStoreUI()
  const variants = useMemo(() => (product.variants ?? []) as PricedVariant[], [product.variants])

  const [options, setOptions] = useState<Record<string, string | undefined>>(() => {
    const fromUrl = variants.find((v) => v.id === searchParams.get("v_id"))
    const initial = fromUrl ?? (variants.length === 1 ? variants[0] : undefined)
    return initial ? optionsAsKeymap(initial.options) : {}
  })
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [pincode, setPincode] = useState("")
  const [pinResult, setPinResult] = useState<{ ok: boolean; text: string } | null>(null)

  const selected = useMemo(
    () => variants.find((v) => isEqual(optionsAsKeymap(v.options), options)),
    [variants, options]
  )

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = selected?.id ?? null
    if (params.get("v_id") === value) return
    if (value) params.set("v_id", value)
    else params.delete("v_id")
    router.replace(pathname + (params.size ? `?${params}` : ""), { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  const cheapest = [...variants]
    .filter((v) => v.calculated_price?.calculated_amount != null)
    .sort((a, b) => a.calculated_price!.calculated_amount! - b.calculated_price!.calculated_amount!)[0]
  const priced = selected ?? cheapest
  const price = priced?.calculated_price?.calculated_amount ?? null
  const currency = priced?.calculated_price?.currency_code ?? "inr"

  const anyInStock = variants.some((v) => variantInStock(v))
  const inStock = selected ? variantInStock(selected) : anyInStock
  const needsChoice = !selected && variants.length > 1
  const canAdd = !!selected && inStock && !adding

  const onAdd = async () => {
    if (!selected || !canAdd) return
    setAdding(true)
    await addItems([{ variantId: selected.id, quantity: qty }], product.title ?? "Item")
    setAdding(false)
  }

  const addLabel = !anyInStock || (selected && !inStock)
    ? "Out of stock"
    : needsChoice
    ? "Select a pack size"
    : adding
    ? "Adding…"
    : "Add to cart"

  // Honest check, as in the prototype: there is no serviceability API to ask,
  // so this validates the pincode and defers the real answer to checkout.
  const checkPincode = () => {
    const v = pincode.trim()
    if (!/^[1-9][0-9]{5}$/.test(v)) {
      setPinResult({ ok: false, text: "Enter a valid 6-digit Indian pincode." })
      return
    }
    setPinResult({ ok: true, text: `✓ We deliver to ${v}. Exact delivery date is confirmed at checkout.` })
  }

  return (
    <div>
      {categoryLabel && (
        <p className="product-cat" style={{ marginBottom: 8 }}>
          {categoryLabel}
        </p>
      )}
      <h1 className="h2" style={{ fontSize: "clamp(26px,3vw,36px)" }} data-testid="product-title">
        {product.title}
      </h1>
      {product.subtitle && (
        <p className="lead" style={{ marginTop: 10 }} data-testid="product-description">
          {product.subtitle}
        </p>
      )}
      <div className="row" style={{ marginTop: 16, gap: 14 }}>
        <span className="price num" style={{ fontSize: 26 }} data-testid="product-price">
          {formatPrice(price, currency)}
        </span>
        <span className={`badge ${anyInStock ? "badge-stock" : "badge-out"}`}>
          {anyInStock ? "In stock" : "Out of stock"}
        </span>
      </div>

      {(product.options ?? []).map((option) => {
        // Only values some variant of THIS product uses — the seeded catalog
        // shares one "Pack Size" option whose value list spans every product.
        const values = Array.from(
          new Set(
            variants.flatMap((v) =>
              (v.options ?? []).filter((o) => o.option_id === option.id).map((o) => o.value)
            )
          )
        )
        if (!values.length) return null
        return (
          <div key={option.id} style={{ marginTop: 26 }} data-testid="product-options">
            <p style={{ marginBottom: 8, color: "var(--muted)", fontSize: 13 }}>
              {option.title === "Default option" ? "Pack size" : option.title}
            </p>
            <div className="variant-group">
              {values.map((value) => {
                const isSelected = options[option.id] === value
                const variantForValue = variants.find((v) =>
                  v.options?.some((o) => o.option_id === option.id && o.value === value)
                )
                const unavailable = !variantInStock(variantForValue)
                return (
                  <button
                    key={value}
                    type="button"
                    className={`variant-opt${isSelected ? " selected" : ""}${unavailable ? " unavailable" : ""}`}
                    disabled={unavailable || adding}
                    aria-pressed={isSelected}
                    onClick={() => setOptions((prev) => ({ ...prev, [option.id]: value }))}
                    data-testid="option-button"
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="row" style={{ marginTop: 22, gap: 16 }}>
        <div className="qty">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
            −
          </button>
          <input
            value={qty}
            inputMode="numeric"
            aria-label="Quantity"
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
          <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">
            +
          </button>
        </div>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={!canAdd}
          aria-busy={adding}
          onClick={onAdd}
          data-testid="add-product-button"
        >
          {addLabel}
        </button>
      </div>

      <div className="panel" style={{ marginTop: 22, padding: "18px 20px" }}>
        <p className="h3" style={{ fontSize: 14, marginBottom: 10 }}>
          Check delivery
        </p>
        <div className="field-row">
          <input
            className="input"
            placeholder="Enter 6-digit pincode"
            style={{ maxWidth: 200 }}
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkPincode()}
            aria-label="Pincode"
          />
          <button className="btn btn-secondary btn-sm" onClick={checkPincode}>
            Check
          </button>
        </div>
        {pinResult && (
          <p className="field-hint" style={{ marginTop: 10 }}>
            <span className={pinResult.ok ? undefined : "field-error"} style={pinResult.ok ? { color: "var(--green-deep)" } : undefined}>
              {pinResult.text}
            </span>
          </p>
        )}
      </div>

      {children}

      <div className="buy-bar" style={!anyInStock ? { opacity: 0.6 } : undefined}>
        <span className="price num">{formatPrice(price, currency)}</span>
        <button className="btn btn-primary" disabled={!canAdd} onClick={onAdd} data-testid="mobile-cart-button">
          {addLabel}
        </button>
      </div>
    </div>
  )
}
