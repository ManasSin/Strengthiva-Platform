"use client"

import { useStoreUI } from "@lib/context/store-ui"
import { CardProduct, CategoryTile } from "@lib/util/store-catalog"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  BagIcon,
  CartIcon,
  CloseIcon,
  HomeIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@modules/common/components/store-icons"
import HeaderSearch from "@modules/layout/components/header-search"
import Image from "next/image"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { Suspense } from "react"

export type NavLink = { label: string; href: string }

/*
  The handoff's header (.topbar), mobile menu (#mobilePanel) and mobile bottom
  tab bar (#mobileTabbar) — one client component because all three share the
  menu / drawer state and the cart count.
*/
export default function Topbar({
  navLinks,
  mobileLinks,
  products,
  categories,
  cartCount,
}: {
  navLinks: NavLink[]
  mobileLinks: NavLink[]
  products: CardProduct[]
  categories: CategoryTile[]
  cartCount: number
}) {
  const { openCart, menuOpen, openMenu, closeMenu } = useStoreUI()
  const { countryCode } = useParams() as { countryCode: string }
  const rest = usePathname().replace(`/${countryCode}`, "")
  // The handoff shows the assessment announcement on the shopping pages
  // (collection, product, cart, search) — not on home, which has its own
  // deal strip, nor on the content/account pages.
  const showAnnounce = /^\/(store|categories|collections|products|cart|search)(\/|$)/.test(rest)

  return (
    <>
      {showAnnounce && (
        <div className="announce">
          <div className="container">
            <span>Free 3-minute Ayurvedic assessment — get your personalized reading, no card required.</span>
            <span className="meta">·</span>
            <LocalizedClientLink href="/personalized" className="meta" style={{ textDecoration: "underline" }}>
              Take the assessment
            </LocalizedClientLink>
          </div>
        </div>
      )}
      <header className="topbar">
        <div className="container topbar-row">
          <button className="icon-btn mobile-toggle" onClick={openMenu} aria-label="Open menu" data-testid="nav-menu-button">
            <MenuIcon />
          </button>
          <LocalizedClientLink href="/" className="logo" aria-label="Strengthiva home" data-testid="nav-store-link">
            <Image
              src="/logo-green.png"
              alt="Strengthiva"
              width={400}
              height={321}
              priority
              className="logo-img"
            />
          </LocalizedClientLink>
          <nav className="main-nav" aria-label="Primary">
            {navLinks.map((l) => (
              <LocalizedClientLink key={l.href} href={l.href}>
                {l.label}
              </LocalizedClientLink>
            ))}
          </nav>
          <Suspense fallback={<div className="search-wrap" />}>
            <HeaderSearch products={products} categories={categories} />
          </Suspense>
          <div className="nav-actions">
            <LocalizedClientLink href="/account" className="icon-btn" aria-label="Account" data-testid="nav-account-link">
              <UserIcon />
            </LocalizedClientLink>
            <button className="icon-btn" aria-label={`Cart, ${cartCount} items`} onClick={openCart} data-testid="nav-cart-link">
              <CartIcon />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-panel${menuOpen ? " open" : ""}`} id="mobilePanel" data-testid="nav-menu-popup">
        <div className="mobile-panel-inner">
          <div className="row-between" style={{ marginBottom: 20 }}>
            <span className="logo">
              <Image src="/logo-green.png" alt="Strengthiva" width={400} height={321} className="logo-img" />
            </span>
            <button className="icon-btn" onClick={closeMenu} aria-label="Close menu" data-testid="close-menu-button">
              <CloseIcon />
            </button>
          </div>
          {mobileLinks.map((l) => (
            <LocalizedClientLink key={l.href} href={l.href} onClick={closeMenu}>
              {l.label}
            </LocalizedClientLink>
          ))}
        </div>
      </div>

      <MobileTabbar cartCount={cartCount} />
    </>
  )
}

const TABS = [
  { id: "home", href: "", label: "Home", Icon: HomeIcon },
  { id: "shop", href: "/store", label: "Shop", Icon: BagIcon },
  { id: "search", href: "/search", label: "Search", Icon: SearchIcon },
  { id: "cart", href: "/cart", label: "Cart", Icon: CartIcon },
  { id: "account", href: "/account", label: "Account", Icon: UserIcon },
]

function MobileTabbar({ cartCount }: { cartCount: number }) {
  const { countryCode } = useParams() as { countryCode: string }
  const pathname = usePathname()
  const rest = pathname.replace(`/${countryCode}`, "") || ""

  // Product pages carry their own sticky buy bar in that slot, and the order
  // confirmation has neither (product.html / order-confirmation.html). The
  // layout's bottom padding (.has-tabbar) is sized to fit either bar.
  if (/^\/(products|order)\//.test(rest)) return null

  const active =
    rest === ""
      ? "home"
      : rest.startsWith("/store") || rest.startsWith("/categories") || rest.startsWith("/collections")
      ? "shop"
      : rest.startsWith("/search")
      ? "search"
      : rest.startsWith("/cart")
      ? "cart"
      : rest.startsWith("/account")
      ? "account"
      : null

  return (
    <nav className="mobile-tabbar" aria-label="Shop">
      {TABS.map(({ id, href, label, Icon }) => (
        <Link
          key={id}
          className={`mt-item${active === id ? " active" : ""}`}
          href={`/${countryCode}${href}`}
          aria-current={active === id ? "page" : undefined}
        >
          <Icon />
          <span>{label}</span>
          {id === "cart" && cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </Link>
      ))}
    </nav>
  )
}
