import { listCategories } from "@lib/data/categories"
import { NAV_CATEGORY_HANDLES, toCategoryTiles } from "@lib/util/store-catalog"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

/*
  Footer from the "store redesign 02" handoff (.pagefoot). The Shop column uses
  the same real categories as the header's shortcuts.

  Deviation from the prototype, on purpose: its payment chips list "COD", but
  the store takes payment through Razorpay only (no cash-on-delivery provider
  in apps/medusa/medusa-config.ts), so COD is left off rather than promised.
  The prototype's policy links were "#" placeholders; they stay out until the
  policy pages exist.
*/
export default async function Footer() {
  const tiles = toCategoryTiles(await listCategories())
  const byHandle = new Map(tiles.map((t) => [t.handle, t]))
  const shopCategories = NAV_CATEGORY_HANDLES.map((h) => byHandle.get(h)).filter(
    (t): t is NonNullable<typeof t> => !!t
  )

  return (
    <footer className="pagefoot">
      <div className="container">
        <div className="grid-4" style={{ gap: 32 }}>
          <div>
            <LocalizedClientLink href="/" className="logo" aria-label="Strengthiva home" style={{ padding: 0 }}>
              <Image src="/logo-green.png" alt="Strengthiva" width={400} height={321} className="logo-img" />
            </LocalizedClientLink>
            <p className="pf-copy">© {new Date().getFullYear()} Strengthiva. Modern Ayurvedic Wisdom.</p>
          </div>
          <div>
            <p className="h4">Shop</p>
            <LocalizedClientLink href="/store">All products</LocalizedClientLink>
            {shopCategories.map((c) => (
              <LocalizedClientLink key={c.id} href={`/categories/${c.handle}`} data-testid="category-link">
                {c.label}
              </LocalizedClientLink>
            ))}
          </div>
          <div>
            <p className="h4">Strengthiva</p>
            <LocalizedClientLink href="/about">About Strengthiva</LocalizedClientLink>
            <LocalizedClientLink href="/personalized">Personalized recommendations</LocalizedClientLink>
            <LocalizedClientLink href="/learn">Learn Ayurveda</LocalizedClientLink>
            <LocalizedClientLink href="/account/orders">Track an order</LocalizedClientLink>
          </div>
          <div>
            <p className="h4">Get in touch</p>
            <a href="mailto:hello@strengthiva.com">hello@strengthiva.com</a>
          </div>
        </div>
        <div className="bottom">
          <span>Formulations are educational and wellness-oriented, not a substitute for medical advice.</span>
          <div className="payment-icons">
            <span>UPI</span>
            <span>Cards</span>
            <span>Net Banking</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
