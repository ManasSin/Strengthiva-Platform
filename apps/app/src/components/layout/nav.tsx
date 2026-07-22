import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { STORE_URL } from "@/lib/site";

// Marketing nav, per the Figma "Strengthiva - Home" export. Distinct from the
// authenticated app shell's Home/Wellness/Activity/Profile nav (modules/app-frontend.md
// §6) — that one hasn't been designed yet and isn't built here.
export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-headline text-xl font-bold text-primary">
          Strengthiva
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-foreground md:flex">
          <Link href="/assessment" className="border-b-2 border-primary pb-1 text-primary">
            Assessment
          </Link>
          {/* Products routes cross-app to store.strengthiva.com, per
              modules/app-frontend.md §1 — not an in-app page. */}
          <a href={STORE_URL} className="hover:text-primary">
            Products
          </a>
          <Link href="/diet-plans" className="hover:text-primary">
            Diet Plans
          </Link>
          <Link href="/about" className="hover:text-primary">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          {/* Server-gated at /account/layout.tsx — a signed-out visitor who clicks
              this is redirected to /login and back again, so the link doesn't need
              to know whether there's a session. */}
          <Link href="/account" className="text-sm font-medium text-foreground hover:text-primary">
            Account
          </Link>
          <ButtonLink href="/assessment" variant="default" size={"lg"} className="text-sm">
            Start Assessment
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
