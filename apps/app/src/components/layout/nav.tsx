"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { BrandMark } from "@/components/ui/botanical";
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
//
// Restyled for the 2026-08 rebrand against docs/redesign/new design style 1.html
// (`.nav`). Destinations are unchanged: the reference's labels ("How it works",
// "Where we stand") are anchors into a one-page demo, whereas these are real
// routes, and renaming them would break live links for nothing.
type NavItem = { label: string; href?: string; store?: boolean };

const NAV_ITEMS: NavItem[] = [
  // Products opens store.strengthiva.com (a separate origin) in a new tab, via
  // StoreLink so a signed-in user carries their login across.
  { label: "Products", store: true },
  { label: "Diet Plans", href: "/diet-plans" },
  { label: "About", href: "/about" },
];

/**
 * Every clickable nav item shares one treatment so hover, active and focus read
 * the same everywhere.
 *
 * The sage underline is a deliberate accent moment (brand-spec.md rule 1): the
 * accent marks *where you are* and *what you're about to click*, which is
 * exactly the "key interactive highlight" the rule reserves it for. It is drawn
 * as a border on a transparent baseline rather than toggled on, so nothing
 * shifts by a pixel between rest and hover.
 */
function navItemClass(active: boolean): string {
  return cn(
    "border-b-2 pb-0.5 text-[0.90625rem] font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
    active
      ? "border-b-accent text-foreground"
      : "border-b-transparent text-muted-foreground hover:border-b-accent hover:text-foreground",
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
    <header className="sticky top-0 z-40 border-b border-hairline-soft bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-[4.375rem] max-w-measure items-center gap-7 px-5 sm:px-7">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-display text-[1.375rem] font-medium tracking-[-0.01em] text-foreground transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <BrandMark className="size-[1.625rem] text-primary" />
          Strengthiva
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
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

        {/* ml-auto rather than `justify-between` on the bar: with three groups of
            very different widths, space-between let the link row drift as labels
            changed. Pinning the right cluster keeps the links locked beside the
            wordmark at every breakpoint. */}
        <div className="ml-auto flex items-center gap-3">
          <UserMenu />
          <ButtonLink
            href="/assessment"
            variant="secondary"
            size="sm"
            className="hidden md:inline-flex"
          >
            Get started
          </ButtonLink>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            // size-11, not size-10: this is the only control on a phone-width
            // header and 40px was under the 44px touch-target minimum.
            className="flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden"
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
          className="border-t border-hairline-soft bg-background px-4 py-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              // Same accent language as the desktop rail, turned on its side: a
              // sage left edge instead of a sage underline.
              const mobileClass = cn(
                "block border-l-2 px-4 py-2.5 text-base font-medium transition-colors",
                active
                  ? "border-l-accent bg-surface text-foreground"
                  : "border-l-transparent text-foreground hover:border-l-accent hover:bg-surface",
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
          <ButtonLink href="/assessment" variant="default" size="lg" className="mt-4 w-full">
            Start the assessment
          </ButtonLink>
        </nav>
      )}
    </header>
  );
}
