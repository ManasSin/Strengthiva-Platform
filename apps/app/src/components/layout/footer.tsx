import { StoreLink } from "@/components/layout/store-link";
import { BrandMark } from "@/components/ui/botanical";

// Restyled for the 2026-08 rebrand against docs/redesign/new design style 1.html
// (`.footer`): mono column headings, a brand block that carries the sprout mark,
// and a hairline-separated bottom row holding the two standing disclaimers.
type FooterLink = { label: string; href?: string; store?: boolean };

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-measure px-5 pb-10 pt-14 sm:px-7">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5 font-display text-[1.375rem] font-medium tracking-[-0.01em] text-foreground">
              <BrandMark className="size-[1.625rem] text-primary" />
              Strengthiva
            </div>
            <p className="mt-3 max-w-[30ch] text-[0.84375rem] leading-relaxed text-muted-foreground">
              Your own health information, turned into a plan you can actually use. © 2026
              Strengthiva. Modern Ayurvedic wisdom.
            </p>
          </div>
          <FooterColumn
            title="Product"
            links={[
              { label: "Assessment", href: "/assessment" },
              { label: "Diet plans", href: "/diet-plans" },
              { label: "Sample plan", href: "/sample-plan" },
              // Opens the store in a new tab, carrying a signed-in user's login.
              { label: "Formulations", store: true },
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              { label: "About us", href: "/about" },
              { label: "Contact", href: "/contact" },
              { label: "FAQs", href: "/faqs" },
              { label: "Shipping policy", href: "/shipping-policy" },
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { label: "Privacy policy", href: "/privacy" },
              { label: "Terms of service", href: "/terms" },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-hairline-soft pt-6 text-[0.8125rem] text-muted-foreground">
          <span>
            Strengthiva is a wellness and education product, not a medical or diagnostic
            service.
          </span>
          <span>Made with care, rooted in the texts.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  // Sage on hover — the same accent language as the nav, so "this is
  // interactive" reads identically at both ends of the page.
  const linkClass =
    "inline-block border-b border-transparent text-sm text-muted-foreground transition-colors hover:border-b-accent hover:text-foreground";
  return (
    <div>
      <h4 className="mb-4 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.store ? (
              <StoreLink className={linkClass}>{link.label}</StoreLink>
            ) : (
              <a href={link.href} className={linkClass}>
                {link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
