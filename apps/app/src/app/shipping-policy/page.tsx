import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";
import { DraftNotice } from "@/components/legal/draft-notice";

export default function ShippingPolicyPage() {
  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="font-headline text-3xl font-bold text-foreground">Shipping Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: draft, not yet published</p>

          <div className="mt-8">
            <DraftNotice />
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-foreground">
            <section>
              <h2 className="font-headline text-lg font-semibold">Processing time</h2>
              <p className="mt-2 text-muted-foreground">
                Orders are typically processed within 1–2 business days of payment
                confirmation. Final logistics partners and delivery timelines for the India
                launch are still being finalised.
              </p>
            </section>
            <section>
              <h2 className="font-headline text-lg font-semibold">Delivery</h2>
              <p className="mt-2 text-muted-foreground">
                We currently ship within India. Estimated delivery times will be shown at
                checkout once shipping partners are confirmed.
              </p>
            </section>
            <section>
              <h2 className="font-headline text-lg font-semibold">Order tracking</h2>
              <p className="mt-2 text-muted-foreground">
                You&apos;ll be able to view order status from your account&apos;s Order
                History once fulfilment is set up.
              </p>
            </section>
            <section>
              <h2 className="font-headline text-lg font-semibold">Questions</h2>
              <p className="mt-2 text-muted-foreground">
                Reach us at{" "}
                <a href="mailto:orders@strengthiva.com" className="text-primary hover:underline">
                  orders@strengthiva.com
                </a>{" "}
                for anything shipping-related.
              </p>
            </section>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
