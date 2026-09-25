import { HttpTypes } from "@medusajs/types"

/*
  Shared shaping for the "store redesign 02" UI.

  The handoff prototype ran on a hardcoded catalog (assets/products.js). Here
  the same cards, tiles and filters are fed from Medusa, so this file turns a
  StoreProduct / StoreProductCategory into the small, serialisable shapes the
  client components need — and holds the few presentation-only facts Medusa has
  no field for (a category's "concern" label and fallback photo).
*/

export type ProductForm = "tablet" | "syrup" | "oil" | "drops"

export const FORM_LABELS: Record<ProductForm, string> = {
  tablet: "Tablet",
  syrup: "Syrup",
  oil: "Oil",
  drops: "Drops",
}

export type CardProduct = {
  id: string
  handle: string
  title: string
  blurb: string
  thumbnail: string | null
  form: ProductForm
  /** Cheapest variant's price in major units (₹), or null when unpriced. */
  price: number | null
  currencyCode: string
  inStock: boolean
  /** Set when the product has exactly one variant, so a card can add it directly. */
  variantId: string | null
  categoryId: string | null
  categoryHandle: string | null
  categoryLabel: string | null
  /** Index into the cycling cat-chip palette (cc-0 … cc-6). */
  colorIndex: number
  createdAt: string | null
}

export type CategoryTile = {
  id: string
  handle: string
  label: string
  concernLabel: string
  blurb: string
  image: string
  productCount: number
  colorIndex: number
}

// Presentation copy for the categories that exist in Medusa today. Medusa has
// no field for a shopper-facing "concern" phrasing, so it lives here; a
// category missing from this map falls back to its own name.
const CATEGORY_COPY: Record<
  string,
  { concernLabel: string; blurb: string; image: string }
> = {
  "joint-health": {
    concernLabel: "Joint Pain & Mobility",
    blurb: "Ease every step.",
    image: "/images/store/ashwagandha.jpg",
  },
  "gut-health": {
    concernLabel: "Bloating & Digestion",
    blurb: "Support for Agni, your digestive fire.",
    image: "/images/store/turmeric.jpg",
  },
  "respiratory-health": {
    concernLabel: "Cough, Cold & Breathing",
    blurb: "Traditional support for chest and throat.",
    image: "/images/store/tulsi.jpg",
  },
  "renal-health": {
    concernLabel: "Kidney Support",
    blurb: "Formulated for renal wellbeing.",
    image: "/images/store/mortar-pestle.jpg",
  },
  "liver-health": {
    concernLabel: "Liver Support",
    blurb: "Classical support for liver function.",
    image: "/images/store/turmeric.jpg",
  },
  "weight-management": {
    concernLabel: "Weight & Metabolism",
    blurb: "Metabolic support, the Ayurvedic way.",
    image: "/images/store/ashwagandha.jpg",
  },
  "nervous-system": {
    concernLabel: "Stress & Calm",
    blurb: "Grounding formulations for the mind.",
    image: "/images/store/tulsi.jpg",
  },
  "gynaecological-disorder": {
    concernLabel: "Women's Wellness",
    blurb: "Classical support for women's health.",
    image: "/images/store/mortar-pestle.jpg",
  },
}

const FALLBACK_IMAGES = [
  "/images/store/ashwagandha.jpg",
  "/images/store/turmeric.jpg",
  "/images/store/tulsi.jpg",
  "/images/store/mortar-pestle.jpg",
]

/** The categories shown in the header nav, in order, when they exist. */
export const NAV_CATEGORY_HANDLES = [
  "gut-health",
  "joint-health",
  "respiratory-health",
]

export const topLevelCategories = (
  categories: HttpTypes.StoreProductCategory[]
) => categories.filter((c) => !c.parent_category_id && !c.parent_category)

export function toCategoryTiles(
  categories: HttpTypes.StoreProductCategory[]
): CategoryTile[] {
  return topLevelCategories(categories).map((c, i) => {
    const copy = CATEGORY_COPY[c.handle]
    // Category images set in the Medusa admin (metadata.thumbnail) win over the
    // stock photography bundled with the redesign.
    const adminImage =
      typeof c.metadata?.thumbnail === "string" ? c.metadata.thumbnail : null
    return {
      id: c.id,
      handle: c.handle,
      label: c.name,
      concernLabel: copy?.concernLabel ?? c.name,
      blurb: c.description || copy?.blurb || `Shop the ${c.name} range.`,
      image: adminImage ?? copy?.image ?? FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
      productCount: c.products?.length ?? 0,
      colorIndex: i % 7,
    }
  })
}

/**
 * Tablet / syrup / oil / drops — drives the pack illustration and the
 * "Product type" filter. Medusa has no product-form field, so it is read from
 * the title first ("Orthiva Oil", "Tulsi Drops") and the pack size second
 * ("200 ml" → syrup).
 */
export function productForm(product: HttpTypes.StoreProduct): ProductForm {
  return formFromText(product.title, product.variants?.[0]?.title)
}

/** productForm for places that only have titles, e.g. a cart line item. */
export function formFromText(
  title?: string | null,
  packTitle?: string | null
): ProductForm {
  const t = (title ?? "").toLowerCase()
  if (/\boil\b/.test(t)) return "oil"
  if (/\bdrops?\b/.test(t)) return "drops"
  if (/\bsyrup\b/.test(t)) return "syrup"
  if (/\btablets?\b/.test(t)) return "tablet"
  if (/\bml\b/.test((packTitle ?? "").toLowerCase())) return "syrup"
  return "tablet"
}

type PricedVariant = HttpTypes.StoreProductVariant & {
  calculated_price?: { calculated_amount?: number | null; currency_code?: string | null }
}

export function variantInStock(variant?: HttpTypes.StoreProductVariant | null) {
  if (!variant) return false
  if (!variant.manage_inventory) return true
  if (variant.allow_backorder) return true
  return (variant.inventory_quantity ?? 0) > 0
}

export function toCardProduct(
  product: HttpTypes.StoreProduct,
  categories: HttpTypes.StoreProductCategory[]
): CardProduct {
  const variants = (product.variants ?? []) as PricedVariant[]
  const priced = variants
    .filter((v) => v.calculated_price?.calculated_amount != null)
    .sort(
      (a, b) =>
        (a.calculated_price!.calculated_amount ?? 0) -
        (b.calculated_price!.calculated_amount ?? 0)
    )
  const cheapest = priced[0]
  const category = product.categories?.[0] ?? null
  const topLevel = topLevelCategories(categories)
  const catIndex = category ? topLevel.findIndex((c) => c.id === category.id) : -1

  return {
    id: product.id,
    handle: product.handle ?? "",
    title: product.title ?? "",
    blurb: product.subtitle || "",
    thumbnail: product.thumbnail || product.images?.[0]?.url || null,
    form: productForm(product),
    price: cheapest?.calculated_price?.calculated_amount ?? null,
    currencyCode: cheapest?.calculated_price?.currency_code ?? "inr",
    inStock: variants.some((v) => variantInStock(v)),
    variantId: variants.length === 1 ? variants[0].id : null,
    categoryId: category?.id ?? null,
    categoryHandle: category?.handle ?? null,
    categoryLabel: category?.name ?? null,
    colorIndex: (catIndex < 0 ? 0 : catIndex) % 7,
    createdAt: (product.created_at as string | undefined) ?? null,
  }
}

/** "₹1,249" — the prototype's fmtPrice, currency-aware for non-INR regions. */
export function formatPrice(amount: number | null, currencyCode = "inr") {
  if (amount == null) return ""
  if (currencyCode.toLowerCase() === "inr") {
    return "₹" + amount.toLocaleString("en-IN")
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(amount)
}
