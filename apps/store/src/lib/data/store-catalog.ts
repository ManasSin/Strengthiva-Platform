import "server-only"

import { HttpTypes } from "@medusajs/types"
import {
  CardProduct,
  CategoryTile,
  toCardProduct,
  toCategoryTiles,
} from "@lib/util/store-catalog"
import { listCategories } from "./categories"
import { listProducts } from "./products"

export const CATALOG_PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.options,+metadata,+tags,+subtitle,*categories,*images"

export type Catalog = {
  products: HttpTypes.StoreProduct[]
  cards: CardProduct[]
  categories: HttpTypes.StoreProductCategory[]
  tiles: CategoryTile[]
}

/**
 * The whole storefront catalog in one read. The range is small (14 products
 * today), so the redesign filters and searches it on the client exactly like
 * the prototype did, instead of paging through Medusa. listProducts is
 * force-cached per region, so every page that calls this shares one fetch.
 * Revisit if the catalog grows past a few hundred products.
 */
export async function getCatalog(
  countryCode: string,
  queryParams?: HttpTypes.StoreProductListParams
): Promise<Catalog> {
  const [{ response }, categories] = await Promise.all([
    listProducts({
      countryCode,
      queryParams: {
        limit: 100,
        fields: CATALOG_PRODUCT_FIELDS,
        ...queryParams,
      },
    }),
    listCategories(),
  ])

  return {
    products: response.products,
    cards: response.products.map((p) => toCardProduct(p, categories)),
    categories,
    tiles: toCategoryTiles(categories),
  }
}
