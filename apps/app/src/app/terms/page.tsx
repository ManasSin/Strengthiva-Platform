import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";
import { DraftNotice } from "@/components/legal/draft-notice";

export default function TermsPage() {
  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="font-display text-3xl font-bold text-foreground">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: draft, not yet published</p>

          <div className="mt-8">
            <DraftNotice />
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-foreground">
            <section>
              <h2 className="font-display text-lg font-semibold">Not medical advice</h2>
              <p className="mt-2 text-muted-foreground">
                Strengthiva provides general Ayurvedic wellness information and product
                recommendations based on self-reported answers. It is not a substitute for
                professional medical diagnosis or treatment. Always consult a qualified
                physician for medical concerns, especially before starting any new supplement
                if you are pregnant, nursing, or managing a chronic condition.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold">Your account</h2>
              <p className="mt-2 text-muted-foreground">
                One account is shared across app.strengthiva.com and store.strengthiva.com.
                You&apos;re responsible for keeping your login credentials secure.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold">Assessment accuracy</h2>
              <p className="mt-2 text-muted-foreground">
                Your report is only as accurate as the information you provide. Product
                recommendations reflect the information available at the time of your
                assessment and may change as our catalog and product mappings are updated.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold">Purchases</h2>
              <p className="mt-2 text-muted-foreground">
                Orders placed through store.strengthiva.com are subject to our Shipping
                Policy. Payment is processed by a third-party payment provider; we do not
                store your card details.
              </p>
            </section>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
