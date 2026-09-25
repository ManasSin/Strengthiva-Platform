import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-bg relative small:min-h-screen">
      <header className="topbar">
        <div className="container topbar-row">
          <LocalizedClientLink href="/" className="logo" data-testid="store-link">
            <Image
              src="/logo-green.png"
              width={400}
              height={321}
              className="logo-img"
              alt="Strengthiva"
            />
          </LocalizedClientLink>
          <nav className="main-nav" aria-label="Primary">
            <span className="meta">Secure checkout</span>
          </nav>
          <div className="nav-actions">
            <LocalizedClientLink
              href="/cart"
              className="btn btn-ghost"
              data-testid="back-to-cart-link"
            >
              Back to cart
            </LocalizedClientLink>
          </div>
        </div>
      </header>
      <main id="content">
        <div data-testid="checkout-container">{children}</div>
      </main>
    </div>
  )
}
