"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, UserRound, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { ButtonLink } from "@/components/ui/button-link";
import { STORE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

// Marketing nav. Client component because three things depend on runtime state
// that the server doesn't have: the active-item highlight (usePathname), the
// signed-in/signed-out account slot (useSession), and the mobile menu toggle.
//
// One assessment entry point on purpose. There used to be both an "Assessment"
// text link and a "Start Assessment" button, which is two doors to the same room
// — the CTA is now the single, unambiguous way in, and the nav links are the
// other destinations.
type NavItem = { label: string; href: string; external?: boolean };

const NAV_ITEMS: NavItem[] = [
  // Products lives on store.strengthiva.com, a different origin — a plain <a>,
  // not a client-routed <Link>.
  { label: "Products", href: STORE_URL, external: true },
  { label: "Diet Plans", href: "/diet-plans" },
  { label: "About", href: "/about" },
];

const TEMP_EMAIL_DOMAIN = "@phone.strengthiva.com";
// auth.ts assigns this display name to OTP sign-ups before a real one is given.
const PLACEHOLDER_NAME = "there";

/**
 * Every clickable nav item shares one pill so hover, active and focus read the
 * same everywhere. `data-active` drives the current-page treatment; the
 * focus-visible ring is the brand green (--ring) and clears the translucent
 * header via ring-offset.
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
    // External destinations (the store) are never "the current page".
    if (item.external) return false;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };
}

function NavItemLink({ item, active }: { item: NavItem; active: boolean }) {
  const className = navItemClass(active);
  return item.external ? (
    <a href={item.href} className={className}>
      {item.label}
    </a>
  ) : (
    <Link href={item.href} className={className} aria-current={active ? "page" : undefined}>
      {item.label}
    </Link>
  );
}

/** One or two initials for the avatar, or null when we should fall back to an icon. */
function accountInitials(user: { name?: string | null; email: string }): string | null {
  const name = user.name?.trim();
  if (name && name.toLowerCase() !== PLACEHOLDER_NAME) {
    const [first, second] = name.split(/\s+/);
    return (first[0] + (second?.[0] ?? "")).toUpperCase();
  }
  if (user.email && !user.email.endsWith(TEMP_EMAIL_DOMAIN)) {
    return user.email[0].toUpperCase();
  }
  return null;
}

/**
 * The account entry point. Signed in, it's a compact profile avatar; signed out,
 * a "Log in" pill. While the session is still resolving it's a fixed-size
 * placeholder so the header doesn't shift when it settles.
 */
function AccountSlot() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="size-9 animate-pulse rounded-full bg-foreground/10" aria-hidden />;
  }

  if (!session) {
    return (
      <Link href="/login" className={navItemClass(false)}>
        Log in
      </Link>
    );
  }

  const initials = accountInitials(session.user);
  return (
    <Link
      href="/account"
      aria-label="Your account"
      title="Your account"
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition-colors",
        "hover:bg-primary/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      {initials ?? <UserRound className="size-[18px]" aria-hidden />}
    </Link>
  );
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
          {NAV_ITEMS.map((item) => (
            <NavItemLink key={item.label} item={item} active={isActive(item)} />
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <AccountSlot />
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
              const className = cn(
                "block rounded-lg px-4 py-2.5 text-base font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-foreground/[0.04]",
              );
              return (
                <li key={item.label}>
                  {item.external ? (
                    <a href={item.href} className={className}>
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className={className}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <ButtonLink
            href="/assessment"
            variant="default"
            size="lg"
            className="mt-3 w-full"
          >
            Start Assessment
          </ButtonLink>
        </nav>
      )}
    </header>
  );
}
