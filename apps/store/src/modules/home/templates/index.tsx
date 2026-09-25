import { Catalog } from "@lib/data/store-catalog"
import { HERO_PRODUCT_HANDLES, HOME_BUNDLE, STORE_OFFER } from "@lib/store-content"
import { formatPrice, numberWord } from "@lib/util/store-catalog"
import { ProductVisual } from "@modules/common/components/bottle"
import CtaBand from "@modules/common/components/cta-band"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StoreAccordion from "@modules/common/components/store-accordion"
import {
  BookIcon,
  CheckCircleIcon,
  ConcernIcon,
  LinesIcon,
  ShieldIcon,
  TagIcon,
} from "@modules/common/components/store-icons"
import BundleAdd from "@modules/home/components/bundle-add"
import { ProductGrid } from "@modules/products/components/product-card"

/*
  Home — index.html from the "store redesign 02" handoff, section for section,
  on the live Medusa catalog. Counts ("14 classical formulations", "Eight
  ranges") are computed from the catalog rather than hardcoded.
*/

const FAQ = [
  {
    title: "Is this the same as the Strengthiva assessment app?",
    body: "No — this store sells Strengthiva's formulations directly, and works whether or not you ever take the assessment. The assessment is a separate, optional experience that can point you back to specific products here.",
  },
  {
    title: "Do personalized recommendations replace medical advice?",
    body: "No. The assessment is wellness and education, reviewed by Ayurvedic practitioners — it is not a diagnosis. For medical decisions, Strengthiva always points you to a qualified professional.",
  },
  {
    title: "Do you deliver across India?",
    body: "Enter your pincode on any product page to check delivery to your address; exact timelines are confirmed at checkout.",
  },
  {
    // The prototype also listed cash on delivery; the store has no COD
    // provider (payments are Razorpay only), so it isn't promised here.
    title: "What payment methods do you accept?",
    body: "Checkout supports the common Indian methods — UPI, cards and net banking — shown at checkout once your address is confirmed.",
  },
]

export default function HomeTemplate({ catalog }: { catalog: Catalog }) {
  const { cards, tiles } = catalog
  const byHandle = new Map(cards.map((c) => [c.handle, c]))
  const heroProducts = HERO_PRODUCT_HANDLES.map((h) => byHandle.get(h)).filter(
    (c): c is NonNullable<typeof c> => !!c
  )
  const bundle = HOME_BUNDLE.handles.map((h) => byHandle.get(h))
  const bundleReady = bundle.every((b) => b && b.variantId && b.price != null && b.inStock)
  const bundleTotal = bundle.reduce((sum, b) => sum + (b?.price ?? 0), 0)
  const bundleCurrency = bundle[0]?.currencyCode ?? "inr"

  return (
    <>
      {STORE_OFFER && (
        <div className="deal-strip">
          <div className="container">
            <strong>{STORE_OFFER.strip}</strong>
            <span>·</span>
            <span>Free assessment inside</span>
          </div>
        </div>
      )}

      <section className="section hero" style={{ paddingBlock: "clamp(28px,5vw,64px)" }}>
        <div className="container hero-split">
          <div>
            {STORE_OFFER && (
              <span className="deal-ribbon" style={{ marginBottom: 14 }}>
                <TagIcon style={{ width: 14, height: 14 }} />
                {STORE_OFFER.ribbon}
              </span>
            )}
            <h1 className="h1" style={{ fontSize: "clamp(30px,4.4vw,54px)" }}>
              Ayurveda, without the guesswork
            </h1>
            <p className="lead" style={{ marginTop: 10 }}>
              {cards.length} classical formulations. No fillers, no fluff.
            </p>
            <div className="row" style={{ marginTop: 20, flexWrap: "wrap" }}>
              <LocalizedClientLink href="/store" className="btn btn-primary mobile-full">
                Shop Now
              </LocalizedClientLink>
              <LocalizedClientLink href="/personalized" className="btn btn-ghost btn-arrow">
                Free assessment
              </LocalizedClientLink>
            </div>
          </div>
          {heroProducts.length > 0 && (
            <div className="panel" style={{ padding: 20 }}>
              <div className="grid-3 keep-3" style={{ gap: 12 }}>
                {heroProducts.map((p) => (
                  <LocalizedClientLink
                    key={p.id}
                    href={`/products/${p.handle}`}
                    className="product-media"
                    style={{ aspectRatio: "1/1.15" }}
                    aria-label={p.title}
                  >
                    <ProductVisual thumbnail={p.thumbnail} form={p.form} name={p.title} bare />
                  </LocalizedClientLink>
                ))}
              </div>
              <p className="field-hint center" style={{ marginTop: 12 }}>
                {heroProducts.map((p) => p.title.replace(/ (Syrup|Tablet)$/, "")).join(" · ")}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="section pt-0" style={{ paddingBottom: 8 }}>
        <div className="container">
          <div className="usp-strip">
            <div className="usp-item">
              <ShieldIcon />
              100% Ayurvedic
            </div>
            <div className="usp-item">
              <LinesIcon />
              Secure UPI &amp; card payments
            </div>
            <div className="usp-item">
              <CheckCircleIcon />
              Practitioner-reviewed
            </div>
            <div className="usp-item">
              <BookIcon />
              Traceable, batch-tested
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="row-between" style={{ marginBottom: 32, flexWrap: "wrap" }}>
            <div>
              <p className="eyebrow">Shop by category</p>
              <h2 className="h2">{numberWord(tiles.length)} ranges, one classical system</h2>
            </div>
            <LocalizedClientLink href="/store" className="btn btn-ghost btn-arrow">
              View all categories
            </LocalizedClientLink>
          </div>
          <div className="grid-4" style={{ gap: 18 }}>
            {tiles.map((c) => (
              <LocalizedClientLink key={c.id} className="cat-tile" href={`/categories/${c.handle}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative; may be a remote R2 URL */}
                <img src={c.image} alt="" loading="lazy" />
                <span className={`cat-tile-badge cat-chip cc-${c.colorIndex}`}>{c.label}</span>
                <div className="cat-tile-label">
                  <p className="meta">{c.blurb}</p>
                </div>
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="row-between" style={{ marginBottom: 28, flexWrap: "wrap" }}>
            <div>
              <p className="eyebrow">The full range</p>
              <h2 className="h2">Every formulation, one page</h2>
            </div>
            <LocalizedClientLink href="/store" className="btn btn-ghost btn-arrow">
              View all products
            </LocalizedClientLink>
          </div>
          <ProductGrid products={cards.slice(0, 8)} />
        </div>
      </section>

      <section className="section" id="concerns">
        <div className="container">
          <div style={{ maxWidth: "52ch", marginBottom: 32 }}>
            <p className="eyebrow">Shop by wellness interest</p>
            <h2 className="h2">Shop by how you feel</h2>
            <p className="field-hint" style={{ marginTop: 8 }}>
              Not a diagnosis — see a practitioner for ongoing concerns.
            </p>
          </div>
          <div className="grid-4" style={{ gap: 16 }}>
            {tiles.map((c) => (
              <LocalizedClientLink key={c.id} className="concern-tile" href={`/categories/${c.handle}`}>
                <div className="mark">
                  <ConcernIcon handle={c.handle} />
                </div>
                <h3 className="h3" style={{ fontSize: 16 }}>
                  {c.concernLabel}
                </h3>
                <span className="meta">Shop {c.label} →</span>
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="personal-band">
            <div>
              <p className="eyebrow">Optional</p>
              <h2 className="h2" style={{ fontSize: "clamp(22px,2.8vw,30px)" }}>
                Want a plan built for you, not a category?
              </h2>
              <p className="lead" style={{ marginTop: 10 }}>
                Free 3-min assessment → your reading + a shortlist. Not a diagnosis.
              </p>
              <div className="row" style={{ marginTop: 18, flexWrap: "wrap" }}>
                <LocalizedClientLink href="/personalized" className="btn btn-dark">
                  Take the assessment
                </LocalizedClientLink>
              </div>
            </div>
            <div className="stack">
              {["Constitution", "Digestion", "Sleep", "Energy", "Conditions"].map((t) => (
                <span key={t} className="trait-chip">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ maxWidth: "52ch", marginBottom: 32 }}>
            <p className="eyebrow">Rooted in the texts</p>
            <h2 className="h2">The herbs behind the formulations</h2>
          </div>
          <div className="grid-3">
            <HerbFigure
              src="/images/store/ashwagandha.jpg"
              height={786}
              alt="Freshly harvested ashwagandha (Withania somnifera) roots"
              title="Ashwagandha"
              body="Used across Strengthiva's joint and strength formulations. Classical texts describe it as a rasayana — a rejuvenative taken over time, not a single-dose fix."
            />
            <HerbFigure
              src="/images/store/turmeric.jpg"
              height={1041}
              alt="Turmeric (Curcuma longa) rhizomes, fresh and dried"
              title="Haridra (Turmeric)"
              body="A staple of digestive and detox formulations. Traceable herbs, tested batch by batch — the same standard Strengthiva applies to every ingredient it sources."
            />
            <HerbFigure
              src="/images/store/tulsi.jpg"
              height={786}
              alt="Holy basil (tulsi / Ocimum tenuiflorum) leaves"
              title="Tulsi"
              body="The base of Tulsi Drops and a supporting herb in the respiratory range — one of the most-used plants in home Ayurveda."
            />
          </div>
        </div>
      </section>

      {bundleReady && (
        <section className="section">
          <div className="container">
            <div className="grid-2-1">
              <div>
                <span className="cat-chip cc-1" style={{ marginBottom: 10, display: "inline-flex" }}>
                  Bundle
                </span>
                <h2 className="h2" style={{ fontSize: "clamp(24px,3vw,34px)" }}>
                  {HOME_BUNDLE.title}
                </h2>
                <p className="lead" style={{ marginTop: 8 }}>
                  3 products, 1 order — {HOME_BUNDLE.shortNames.join(", ")}.
                </p>
                <div className="row" style={{ marginTop: 20, flexWrap: "wrap" }}>
                  <div className="grid-3 keep-3" style={{ gap: 12, flex: 1 }}>
                    {bundle.map((b) => (
                      <LocalizedClientLink
                        key={b!.id}
                        href={`/products/${b!.handle}`}
                        className="product-media"
                        style={{ aspectRatio: "1/1" }}
                        aria-label={b!.title}
                      >
                        <ProductVisual thumbnail={b!.thumbnail} form={b!.form} name={b!.title} bare />
                      </LocalizedClientLink>
                    ))}
                  </div>
                </div>
                <div className="row" style={{ marginTop: 20 }}>
                  <span className="price num" style={{ fontSize: 22 }}>
                    {formatPrice(bundleTotal, bundleCurrency)}
                  </span>
                  <BundleAdd variantIds={bundle.map((b) => b!.variantId!)} label={HOME_BUNDLE.title} />
                </div>
              </div>
              <aside className="panel">
                <h3>Fair pricing, no gimmicks</h3>
                <p className="muted" style={{ fontSize: 14.5, marginTop: 10 }}>
                  Three honest prices, no invented &ldquo;bundle discount.&rdquo; Once Strengthiva
                  confirms real bundle pricing, this updates.
                </p>
              </aside>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="grid-3">
            <TrustCard icon={<ShieldIcon strokeWidth={1.6} />} title="Reviewed by practitioners">
              Every reading behind a recommendation is reviewed by Ayurvedic doctors before it
              reaches you.
            </TrustCard>
            <TrustCard icon={<BookIcon strokeWidth={1.6} />} title="Rooted in the texts">
              Formulations trace to classical sources — the Charaka Samhita and the Bhavaprakasha —
              not a marketing brief.
            </TrustCard>
            <TrustCard icon={<CheckCircleIcon strokeWidth={1.6} />} title="We name the limits">
              Nothing here cures a chronic condition, and we say so — a brand willing to name a limit
              is worth trusting on everything else.
            </TrustCard>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="row-between" style={{ marginBottom: 20 }}>
            <div>
              <p className="eyebrow">Customer reviews</p>
              <h2 className="h2" style={{ fontSize: "clamp(24px,3vw,32px)" }}>
                We&apos;re collecting our first verified reviews
              </h2>
            </div>
          </div>
          <div className="panel center" style={{ padding: 44 }}>
            <p className="lead center" style={{ margin: "0 auto" }}>
              No fake reviews here. Real ones land as soon as verified buyers post them.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 800 }}>
          <p className="eyebrow center">Questions</p>
          <h2 className="h2 center" style={{ marginBottom: 28 }}>
            Before you order
          </h2>
          <StoreAccordion items={FAQ} />
        </div>
      </section>

      <CtaBand
        title="Your body isn't generic. Start with the range, or start with the assessment."
        lead="Free. No card required. Your plan is yours whether or not you buy anything."
        fontSize="clamp(26px,3.4vw,40px)"
      />
    </>
  )
}

function HerbFigure({
  src,
  height,
  alt,
  title,
  body,
}: {
  src: string
  height: number
  alt: string
  title: string
  body: string
}) {
  return (
    <figure className="card-flat" style={{ margin: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- content photo, shown uncropped */}
      <img className="content-img" src={src} width={1400} height={height} alt={alt} style={{ width: "100%" }} loading="lazy" />
      <figcaption style={{ marginTop: 14 }}>
        <h3>{title}</h3>
        <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>
          {body}
        </p>
      </figcaption>
    </figure>
  )
}

function TrustCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="feature card-flat">
      <div className="concern-tile" style={{ border: 0, padding: 0 }}>
        <div className="mark">{icon}</div>
        <h3>{title}</h3>
        <p className="muted" style={{ fontSize: 14 }}>
          {children}
        </p>
      </div>
    </div>
  )
}
