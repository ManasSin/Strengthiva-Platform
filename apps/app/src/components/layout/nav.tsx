"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { UserMenu } from "@/components/layout/user-menu";
import { StoreLink } from "@/components/layout/store-link";
import { cn } from "@/lib/utils";

// Marketing nav. Client component because three things depend on runtime state
// that the server doesn't have: the active-item highlight (usePathname), the
// signed-in/signed-out account menu (useSession), and the mobile menu toggle.
//
// One assessment entry point on purpose. There used to be both an "Assessment"
// text link and a "Start Assessment" button, which is two doors to the same room
// — the CTA is now the single, unambiguous way in, and the nav links are the
// other destinations.
type NavItem = { label: string; href?: string; store?: boolean };

const NAV_ITEMS: NavItem[] = [
  // Products opens store.strengthiva.com (a separate origin) in a new tab, via
  // StoreLink so a signed-in user carries their login across.
  { label: "Products", store: true },
  { label: "Diet Plans", href: "/diet-plans" },
  { label: "About", href: "/about" },
];

/**
 * Every clickable nav item shares one pill so hover, active and focus read the
 * same everywhere. The focus-visible ring is the brand green (--ring) and clears
 * the translucent header via ring-offset.
 */
function navItemClass(active: boolean): string {
  return cn(
    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    active
      ? "bg-primary/10 text-primary"
      : "text-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground",
  );
}

function useIsActive() {
  const pathname = usePathname();
  return (item: NavItem) => {
    if (!item.href) return false; // store link is never "the current page"
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };
}

export function MarketingNav() {
  const isActive = useIsActive();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on Escape. Closing on navigation is handled by a
  // bubbled click on the panel itself (below) rather than a pathname effect —
  // any tap inside, link or padding, dismisses it, and it keeps setState out of
  // an effect body.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="rounded-md font-headline text-xl font-bold text-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Strengthiva
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) =>
            item.store ? (
              <StoreLink key={item.label} className={navItemClass(false)}>
                {item.label}
              </StoreLink>
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                className={navItemClass(isActive(item))}
                aria-current={isActive(item) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <UserMenu />
          <ButtonLink href="/assessment" variant="default" size="default" className="hidden md:inline-flex">
            Start Assessment
          </ButtonLink>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Primary"
          onClick={() => setMenuOpen(false)}
          className="border-t border-border bg-background px-4 py-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              const mobileClass = cn(
                "block rounded-lg px-4 py-2.5 text-base font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-foreground/[0.04]",
              );
              return (
                <li key={item.label}>
                  {item.store ? (
                    <StoreLink className={mobileClass}>{item.label}</StoreLink>
                  ) : (
                    <Link
                      href={item.href!}
                      className={mobileClass}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <ButtonLink href="/assessment" variant="default" size="lg" className="mt-3 w-full">
            Start Assessment
          </ButtonLink>
        </nav>
      )}
    </header>
  );
}
