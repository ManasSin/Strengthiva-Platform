"use client"

import { useStoreUI } from "@lib/context/store-ui"
import { useState } from "react"

export default function BundleAdd({
  variantIds,
  label,
}: {
  variantIds: string[]
  label: string
}) {
  const { addItems } = useStoreUI()
  const [adding, setAdding] = useState(false)

  return (
    <button
      className="btn btn-primary"
      disabled={adding}
      aria-busy={adding}
      onClick={async () => {
        setAdding(true)
        await addItems(
          variantIds.map((variantId) => ({ variantId })),
          label
        )
        setAdding(false)
      }}
    >
      {adding ? "Adding…" : "Add trio to cart"}
    </button>
  )
}
