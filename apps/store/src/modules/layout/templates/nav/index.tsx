import { retrieveCart } from "@lib/data/cart"
import { getCatalog } from "@lib/data/store-catalog"
import { NAV_CATEGORY_HANDLES } from "@lib/util/store-catalog"
import { cartItemCount } from "@lib/util/cart-helpers"
import CartDrawer from "@modules/layout/components/cart-drawer"
import Topbar, { NavLink } from "@modules/layout/components/topbar"

/*
  Header for the "store redesign 02" handoff (docs/redesign/store redesign 02),
  with the desktop nav trimmed to Shop All · Shop by Concern (dropdown of every
  category) · Personalized Recommendations. The mobile menu keeps the
  handoff's category shortcuts (NAV_CATEGORY_HANDLES + Renal Health); any that
  don't exist in Medusa are skipped rather than linking to a 404.

  Country/language selectors stay removed (India-only launch — see
  docs/platform-architecture/tech-specs/store-frontend/integration-notes.md).
*/
export default async function Nav({ countryCode }: { countryCode: string }) {
  const [catalog, cart] = await Promise.all([
    getCatalog(countryCode),
    retrieveCart().catch(() => null),
  ])

  const byHandle = new Map(catalog.tiles.map((t) => [t.handle, t]))
  const navCategories = NAV_CATEGORY_HANDLES.map((h) => byHandle.get(h)).filter(
    (t): t is NonNullable<typeof t> => !!t
  )

  // Desktop bar: Shop All, the "Shop by Concern" dropdown (every category —
  // rendered by Topbar after the first link), then Personalized
  // Recommendations. Learn Ayurveda lives in the footer.
  const navLinks: NavLink[] = [
    { label: "Shop All", href: "/store" },
    { label: "Personalized Recommendations", href: "/personalized" },
  ]

  // The mobile menu lists one more category (the prototype's Renal Health)
  // plus the pages that don't fit in the desktop bar.
  const mobileCategories = [...navCategories, byHandle.get("renal-health")].filter(
    (t): t is NonNullable<typeof t> => !!t
  )
  const mobileLinks: NavLink[] = [
    { label: "Shop All", href: "/store" },
    ...mobileCategories.map((c) => ({ label: c.label, href: `/categories/${c.handle}` })),
    { label: "Learn Ayurveda", href: "/learn" },
    { label: "Personalized Recommendations", href: "/personalized" },
    { label: "About Strengthiva", href: "/about" },
    { label: "Account", href: "/account" },
  ]

  return (
    <>
      <Topbar
        navLinks={navLinks}
        mobileLinks={mobileLinks}
        products={catalog.cards}
        categories={catalog.tiles}
        cartCount={cartItemCount(cart)}
      />
      <CartDrawer cart={cart} />
    </>
  )
}
