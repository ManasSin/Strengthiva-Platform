import React, { Suspense } from "react"

import { CardProduct, productForm } from "@lib/util/store-catalog"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StoreAccordion from "@modules/common/components/store-accordion"
import { ProductGrid } from "@modules/products/components/product-card"
import ProductBuyBox from "@modules/products/components/product-buy-box"
import ProductGallery from "@modules/products/components/product-gallery"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import { notFound } from "next/navigation"

/*
  Product page — product.html from the "store redesign 02" handoff.

  The information accordion reads Strengthiva's product metadata where it
  exists (metadata.ingredients / dosage / contraindications — see
  docs/product-data-template.md) and otherwise shows the prototype's labelled
  "pending approved copy" text, so a draft product never presents invented
  claims as fact.
*/

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  images: HttpTypes.StoreProductImage[]
  related: CardProduct[]
}

const metaText = (value: unknown): string | null => {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || null
  if (typeof value === "string" && value.trim()) return value.trim()
  return null
}

// Seeded catalog descriptions start with "[DRAFT — placeholder …]"; those are
// notes for the team, not shopper copy.
const isDraft = (text?: string | null) => !text || /^\s*\[DRAFT/i.test(text)

const ProductTemplate: React.FC<ProductTemplateProps> = ({ product, images, related }) => {
  if (!product || !product.id) {
    return notFound()
  }

  const category = product.categories?.[0] ?? null
  const categoryLabel = category?.name ?? null
  const rangeLabel = categoryLabel ?? "Strengthiva"
  const meta = product.metadata ?? {}
  const concern = rangeLabel.toLowerCase()

  const sections = [
    {
      title: "Benefits",
      body: !isDraft(product.description)
        ? product.description!
        : `A classical Ayurvedic formulation positioned within Strengthiva's ${rangeLabel} range, associated with ${concern}. Specific benefit claims are pending Strengthiva's approved product copy.`,
    },
    {
      title: "Ingredients & composition",
      body:
        metaText(meta.ingredients) ??
        "Full ingredient panel to be published with the final listing. Strengthiva's standard is traceable herbs, tested batch by batch — no undisclosed fillers.",
    },
    {
      title: "Usage & dosage",
      body:
        metaText(meta.dosage) ??
        "Usage and dosage instructions will appear here once approved. Always follow the printed label, and start any new formulation under guidance from a qualified Ayurvedic practitioner.",
    },
    {
      title: "Precautions",
      body:
        metaText(meta.contraindications) ??
        "Detailed precautions are pending approved copy. As a general rule: keep out of reach of children, discontinue on irritation, and consult a doctor if pregnant, nursing, or on existing medication.",
    },
    {
      title: "Is this right for you?",
      body: "General suitability depends on your constitution. Take Strengthiva's free assessment for a reading matched to you, reviewed by an Ayurvedic practitioner — it's optional and never required to order.",
    },
    {
      title: "Shipping & returns",
      body: "Ships across India. Check delivery to your pincode above; exact windows are confirmed at checkout. Return and refund terms follow Strengthiva's published policy.",
    },
    {
      title: "FAQs",
      body: "Have a question about this formulation that isn't answered here? Email hello@strengthiva.com and the team will reply directly.",
    },
  ]

  const galleryImages = images
    .filter((i) => !!i.url)
    .map((i) => ({ id: i.id, url: i.url! }))
  if (!galleryImages.length && product.thumbnail) {
    galleryImages.push({ id: "thumbnail", url: product.thumbnail })
  }

  return (
    <>
      {/* Crumbs and the product share one section, so there's no hairline
          rule and empty band between them. */}
      <section className="section" style={{ paddingTop: 16 }} data-testid="product-container">
        <div className="container">
          <nav className="crumbs" style={{ marginBottom: 18 }} aria-label="Breadcrumb">
            <LocalizedClientLink href="/">Home</LocalizedClientLink>
            <span className="sep">/</span>
            {category ? (
              <LocalizedClientLink href={`/categories/${category.handle}`}>{category.name}</LocalizedClientLink>
            ) : (
              <LocalizedClientLink href="/store">Shop All</LocalizedClientLink>
            )}
            <span className="sep">/</span>
            <span>{product.title}</span>
          </nav>
        </div>
        <div className="container grid-2-1" style={{ gap: 48 }}>
          <ProductGallery images={galleryImages} form={productForm(product)} name={product.title ?? ""} />
          <div>
            <ProductOnboardingCta />
            <Suspense fallback={null}>
              <ProductBuyBox product={product} categoryLabel={categoryLabel}>
                <ul className="row" style={{ marginTop: 20, flexWrap: "wrap", gap: 10 }}>
                  <li className="tag">Classical formulation</li>
                  <li className="tag">Traceable herbs</li>
                  <li className="tag">Batch tested</li>
                </ul>
              </ProductBuyBox>
            </Suspense>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          <p className="field-hint" style={{ marginBottom: 6 }}>
            Some sections below are shown as labelled placeholders pending Strengthiva&apos;s final
            approved product copy — nothing here is a clinical claim.
          </p>
          <StoreAccordion items={sections} defaultOpen={0} />
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          <p className="eyebrow">Customer reviews</p>
          <h2 className="h2" style={{ fontSize: "clamp(22px,2.6vw,28px)" }}>
            No verified reviews yet for this product
          </h2>
          <p className="lead" style={{ marginTop: 10 }}>
            We show real reviews only. Be the first verified buyer to leave one once your order is
            delivered.
          </p>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section" data-testid="related-products-container">
          <div className="container">
            <div className="row-between" style={{ marginBottom: 24 }}>
              <h2 className="h2" style={{ fontSize: "clamp(22px,2.6vw,28px)" }}>
                More from this range
              </h2>
              <LocalizedClientLink
                href={category ? `/categories/${category.handle}` : "/store"}
                className="btn btn-ghost btn-arrow"
              >
                View all
              </LocalizedClientLink>
            </div>
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </>
  )
}

export default ProductTemplate
