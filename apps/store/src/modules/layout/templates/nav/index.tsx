import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

// Restyled for the 2026-08 rebrand to match app.strengthiva.com's header — same
// 70px bar, same hairline underline, same sprout mark beside the wordmark, and
// the same sage underline on interactive items. The two origins sit one click
// apart (the app links here for products and checkout), so a visibly different
// header reads as having left the site.
//
// Structure and data plumbing are untouched: SideMenu still owns regions/locales
// and CartButton still streams in under Suspense.

/** The sprout mark, mirroring apps/app/src/components/ui/botanical.tsx. */
function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20v-8" />
      <path d="M12 12c0-3-2-5-6-5 0 4 2 5 6 5Z" />
      <path d="M12 13c0-3 2-4 5-4 0 3-2 4-5 4Z" />
    </svg>
  )
}

// One treatment for every clickable item in the bar: a sage underline drawn on a
// transparent baseline, so nothing shifts by a pixel between rest and hover.
const navLinkClass =
  "border-b-2 border-b-transparent pb-0.5 text-[0.90625rem] font-medium text-muted transition-colors hover:border-b-accent hover:text-forest"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-[4.375rem] mx-auto border-b border-hairline-soft bg-bg/85 backdrop-blur-md duration-200">
        <nav className="content-container flex items-center gap-7 w-full h-full text-forest">
          <div className="h-full flex items-center small:hidden">
            <SideMenu
              regions={regions}
              locales={locales}
              currentLocale={currentLocale}
            />
          </div>

          <LocalizedClientLink
            href="/"
            className="flex shrink-0 items-center gap-2.5 font-display text-[1.375rem] font-medium tracking-[-0.01em] text-forest transition-opacity hover:opacity-80"
            data-testid="nav-store-link"
          >
            <BrandMark className="size-[1.625rem] shrink-0 text-primary" />
            Strengthiva
          </LocalizedClientLink>

          <div className="hidden small:flex items-center gap-6">
            <LocalizedClientLink className={navLinkClass} href="/store">
              All products
            </LocalizedClientLink>
          </div>

          {/* Right cluster pinned with ml-auto rather than space-between across
              three unequal groups — that let the wordmark drift as the cart
              label changed width between "Cart (0)" and "Cart (12)". */}
          <div className="ml-auto flex items-center gap-x-6 h-full">
            <LocalizedClientLink
              className={`hidden small:inline-block ${navLinkClass}`}
              href="/account"
              data-testid="nav-account-link"
            >
              Account
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className={navLinkClass}
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
