import { getCatalog } from "@lib/data/store-catalog"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import CollectionView from "@modules/store/templates/collection-view"

/* A Medusa collection, in the redesign's collection-page layout. */
export default async function CollectionTemplate({
  sortBy,
  collection,
  countryCode,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  countryCode: string
}) {
  const catalog = await getCatalog(countryCode, { collection_id: [collection.id] })

  return (
    <CollectionView
      products={catalog.cards}
      categories={catalog.tiles}
      initialSort={sortBy ?? "created_at"}
      fixedTitle={collection.title}
    />
  )
}
