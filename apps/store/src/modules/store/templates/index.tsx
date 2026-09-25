import { getCatalog } from "@lib/data/store-catalog"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import CollectionView from "./collection-view"

/*
  /store and /categories/<handle> — both render the redesign's collection page
  (collection.html); a category route just preselects its category.
*/
const StoreTemplate = async ({
  sortBy,
  countryCode,
  categoryHandle,
}: {
  sortBy?: SortOptions
  countryCode: string
  categoryHandle?: string
}) => {
  const catalog = await getCatalog(countryCode)

  return (
    <CollectionView
      products={catalog.cards}
      categories={catalog.tiles}
      initialCategory={categoryHandle ?? "all"}
      initialSort={sortBy ?? "created_at"}
    />
  )
}

export default StoreTemplate
