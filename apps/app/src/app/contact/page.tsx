import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";

// No contact-form backend exists yet — mailto: is the honest, functional option
// today rather than a form that silently goes nowhere.
export default function ContactPage() {
  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h1 className="font-display text-3xl font-bold text-primary md:text-4xl">
            Get In Touch
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Questions about your assessment, an order, or anything else — we&apos;re happy
            to help.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <a
              href="mailto:support@strengthiva.com"
              className="rounded-2xl border border-border bg-background p-6 text-left transition-colors hover:border-primary/40"
            >
              <div className="text-sm font-semibold text-foreground">Email Support</div>
              <div className="mt-1 text-sm text-primary">support@strengthiva.com</div>
              <p className="mt-2 text-xs text-muted-foreground">Typical response time: within 1 business day</p>
            </a>
            <div className="rounded-2xl border border-border bg-background p-6 text-left">
              <div className="text-sm font-semibold text-foreground">Order &amp; Shipping</div>
              <div className="mt-1 text-sm text-primary">orders@strengthiva.com</div>
              <p className="mt-2 text-xs text-muted-foreground">For questions about a store.strengthiva.com order</p>
            </div>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
