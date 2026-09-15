"use client";
import { createContext, useContext, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand, Icon } from "@strengthiva/transparency/ui";
import { Theme, ThemeToggle } from "@strengthiva/transparency/theme";
import { useActiveRail } from "./controls";
const Identity = createContext("");
export const useAdminIdentity = () => useContext(Identity);
const navigation = [
  {
    label: "Operations",
    items: [
      ["/admin/import", "upload", "Import workbook"],
      ["/admin/batches", "layers", "Batches"],
      ["/admin/documents", "file", "Documents"],
      ["/admin/reports", "flask", "Lab reports"],
    ],
  },
  {
    label: "Library",
    items: [
      ["/admin/ingredients", "leaf", "Ingredients"],
      ["/admin/settings", "settings", "Company settings"],
    ],
  },
];
export function isTransparencyRoute(path: string) {
  return /^\/admin\/(batches|import|documents|reports|lots|ingredients|settings)(\/|$)/.test(
    path
  );
}
export function TransparencyShell({
  children,
  email,
}: {
  children: ReactNode;
  email: string;
}) {
  const path = usePathname();
  const mobileNav = useActiveRail<HTMLElement>(path);
  const links = (items: string[][]) =>
    items.map(([href, icon, label]) => (
      <Link
        key={href}
        href={href}
        aria-current={
          path === href || path.startsWith(`${href}/`) ? "page" : undefined
        }
        className={`nav-link ${
          path === href || path.startsWith(`${href}/`) ? "active" : ""
        }`}
      >
        <Icon name={icon} />
        <span>{label}</span>
      </Link>
    ));
  return (
    <Identity.Provider value={email}>
      <Theme>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="app-header">
          <Brand href="/admin/batches" />
          <div className="header-context">Administration</div>
          <div className="header-actions">
            <Link
              href="/admin"
              className="btn btn-secondary header-back"
              aria-label="All admin tools"
            >
              <Icon name="arrow-left" />
              <span className="header-action-label">All admin tools</span>
            </Link>
            <ThemeToggle />
            <span
              className="avatar"
              title={email}
              aria-label={`Signed in as ${email}`}
            >
              {email.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>
        <div className="admin-shell">
          <aside className="sidebar">
            {navigation.map((group) => (
              <div className="nav-group" key={group.label}>
                <div className="nav-label">{group.label}</div>
                <nav className="nav-list" aria-label={group.label}>
                  {links(group.items)}
                </nav>
              </div>
            ))}
            <div className="sidebar-foot">
              <strong>Strengthiva Ayurveda</strong>
              <span>Transparency workspace</span>
            </div>
          </aside>
          <nav
            ref={mobileNav}
            className="mobile-nav"
            aria-label="Transparency pages"
          >
            {links(navigation.flatMap((group) => group.items))}
          </nav>
          <main className="page" id="main">
            <div className="page-inner">{children}</div>
          </main>
        </div>
      </Theme>
    </Identity.Provider>
  );
}
