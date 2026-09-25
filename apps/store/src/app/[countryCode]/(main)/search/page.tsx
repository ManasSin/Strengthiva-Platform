import { Metadata } from "next"
import { Suspense } from "react"

import { getCatalog } from "@lib/data/store-catalog"
import SearchView from "@modules/search/templates/search-view"

export const metadata: Metadata = {
  title: "Search — Strengthiva",
  description: "Search Strengthiva formulations by name, ingredient or concern.",
}

export default async function SearchPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const catalog = await getCatalog(countryCode)

  return (
    <Suspense fallback={null}>
      <SearchView products={catalog.cards} categories={catalog.tiles} />
    </Suspense>
  )
}
