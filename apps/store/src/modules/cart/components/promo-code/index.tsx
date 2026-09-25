"use client"

import { applyPromotions } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { useState } from "react"

/*
  The cart summary's promo field (cart.html). Wired to Medusa promotions via
  the existing applyPromotions action; applied codes are listed with a remove
  control that re-applies the remaining ones.
*/
export default function PromoCode({ cart }: { cart: HttpTypes.StoreCart }) {
  const [code, setCode] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const applied = (cart.promotions ?? []).filter((p) => !p.is_automatic && p.code)
  const appliedCodes = applied.map((p) => p.code!)

  const run = async (codes: string[]) => {
    setError(null)
    setPending(true)
    try {
      await applyPromotions(codes)
      setCode("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "That code couldn't be applied")
    } finally {
      setPending(false)
    }
  }

  return (
    <div style={{ marginTop: 14 }} data-testid="discount-code">
      <form
        className="field-row"
        onSubmit={(e) => {
          e.preventDefault()
          if (code.trim()) run([...appliedCodes, code.trim()])
        }}
      >
        <input
          className="input"
          placeholder="Promo code"
          aria-label="Promo code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          data-testid="discount-input"
        />
        <button className="btn btn-secondary btn-sm" disabled={pending || !code.trim()} aria-busy={pending} data-testid="discount-apply-button">
          Apply
        </button>
      </form>
      {error && (
        <p className="field-error" style={{ marginTop: 8 }} data-testid="discount-error-message">
          {error}
        </p>
      )}
      {applied.length > 0 && (
        <div className="active-filters" style={{ marginTop: 10 }}>
          {applied.map((p) => (
            <span key={p.id} className="filter-chip" data-testid="discount-row">
              <span className="num">{p.code}</span>
              <button
                aria-label={`Remove code ${p.code}`}
                disabled={pending}
                onClick={() => run(appliedCodes.filter((c) => c !== p.code))}
                className="muted"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
