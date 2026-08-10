"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useLogout } from "@/lib/use-logout";

const SECTIONS = [
  { href: "/account", label: "Profile", exact: true },
  { href: "/account/reports", label: "My reports" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/security", label: "Security" },
];

export function AccountNav() {
  const pathname = usePathname();
  const { logout, loggingOut } = useLogout();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {SECTIONS.map((section) => {
        const active = section.exact
          ? pathname === section.href
          : pathname.startsWith(section.href);
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-background hover:text-foreground"
            }`}
          >
            {section.label}
          </Link>
        );
      })}

      {/* Sits at the bottom of the sidebar on desktop (own row above it), and as
          the last chip on the mobile row. Logout clears the app session — see
          useLogout for why the store session is left to expire on its own. */}
      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="mt-0 flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-60 md:mt-2 md:border-t md:border-border md:pt-4"
      >
        <LogOut className="size-4" aria-hidden />
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </nav>
  );
}
