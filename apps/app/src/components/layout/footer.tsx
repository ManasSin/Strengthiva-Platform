export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-tertiary/40">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-4">
        <div>
          <div className="font-headline text-lg font-bold text-primary">Strengthiva</div>
          <p className="mt-2 text-sm text-muted-foreground">© 2026 Strengthiva. Modern Ayurvedic Wisdom.</p>
        </div>
        <FooterColumn
          title="Product"
          links={[
            { label: "Assessment", href: "/assessment" },
            { label: "Diet Plans", href: "/diet-plans" },
            { label: "Supplements", href: "http://localhost:3001" },
          ]}
        />
        <FooterColumn
          title="Support"
          links={[
            { label: "Shipping Policy", href: "/shipping-policy" },
            { label: "Contact Us", href: "/contact" },
            { label: "FAQs", href: "/faqs" },
          ]}
        />
        <FooterColumn
          title="Legal"
          links={[
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
          ]}
        />
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="hover:text-primary">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
