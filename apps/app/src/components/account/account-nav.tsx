"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/account", label: "Profile", exact: true },
  { href: "/account/reports", label: "My reports" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/security", label: "Security" },
];

export function AccountNav() {
  const pathname = usePathname();

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
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-white hover:text-foreground"
            }`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
