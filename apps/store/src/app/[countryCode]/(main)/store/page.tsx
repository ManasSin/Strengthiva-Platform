import { Metadata } from "next"
import { redirect } from "next/navigation"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Shop All — Strengthiva",
  description: "Every Strengthiva formulation, filterable by category, type and price.",
}

type Params = {
  searchParams: Promise<{ sortBy?: SortOptions; q?: string }>
  params: Promise<{ countryCode: string }>
}

export default async function StorePage(props: Params) {
  const { countryCode } = await props.params
  const { sortBy, q } = await props.searchParams

  // Search moved to its own page in the redesign; keep old /store?q= links working.
  if (q) {
    redirect(`/${countryCode}/search?q=${encodeURIComponent(q)}`)
  }

  return <StoreTemplate sortBy={sortBy} countryCode={countryCode} />
}
