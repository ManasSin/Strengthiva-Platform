import { Suspense } from "react"

import { OptionValueIds } from "@lib/util/product-option-filters"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  query,
  countryCode,
  optionValueIds,
}: {
  sortBy?: SortOptions
  page?: string
  query?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const search = query?.trim() || ""

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} query={search} search />
      <div className="w-full">
        <div className="mb-8">
          <h1 data-testid="store-page-title" className="font-display text-heading font-normal text-forest">
            {search ? `Results for “${search}”` : "All products"}
          </h1>
        </div>
        {/* Keyed on everything that changes the result set so the skeleton
            reappears while a new search/page/sort is fetched, instead of the
            previous results sitting there looking current. */}
        <Suspense
          key={`${sort}-${pageNumber}-${search}`}
          fallback={<SkeletonProductGrid />}
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            query={search}
            countryCode={countryCode}
            optionValueIds={optionValueIds}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
