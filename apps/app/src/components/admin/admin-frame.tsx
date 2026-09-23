"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { usePathname } from "next/navigation";
import { Icon } from "@strengthiva/transparency/ui";
import { isTransparencyRoute, TransparencyShell } from "../transparency/shell";

const navigation = [
  ["/admin/batches", "Product transparency", "layers"],
  ["/admin/knowledge-base", "Knowledge base", "file"],
  ["/admin/questionnaire", "Questionnaire", "flask"],
  ["/admin/products", "Products", "settings"],
] as const;

export function AdminFrame({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isTransparencyRoute(pathname)) {
    return <TransparencyShell email={email}>{children}</TransparencyShell>;
  }

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <a
        href="#admin-main"
        className="sr-only z-50 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 max-w-[80rem] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            aria-label="Strengthiva admin home"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <BrandLogo className="h-11" />
            <span className="border-l border-border pl-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Admin
            </span>
          </Link>
          <nav
            aria-label="Admin sections"
            className="order-3 grid w-full grid-cols-2 gap-1 md:order-none md:flex md:w-auto md:flex-1 md:items-center"
          >
            {navigation.map(([href, label, icon]) => {
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-[0.8125rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-3 sm:text-sm md:shrink-0 ${
                    isActive
                      ? "bg-sage-soft text-foreground"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <Icon name={icon} className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <span
            className="ml-auto max-w-full truncate text-sm text-muted-foreground md:ml-0"
            title={email}
          >
            {email}
          </span>
        </div>
      </header>
      <main id="admin-main" className="mx-auto w-full max-w-[80rem] px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
