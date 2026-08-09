import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";
import { DraftNotice } from "@/components/legal/draft-notice";

export default function PrivacyPage() {
  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="font-display text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: draft, not yet published</p>

          <div className="mt-8">
            <DraftNotice />
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-foreground">
            <section>
              <h2 className="font-display text-lg font-semibold">What we collect</h2>
              <p className="mt-2 text-muted-foreground">
                Account details (name, email) via our authentication provider; your health
                assessment answers; any prescription images you upload and the information we
                extract from them; and your order history when you purchase products through
                store.strengthiva.com.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold">How we use it</h2>
              <p className="mt-2 text-muted-foreground">
                To generate your personalised dosha analysis, diet plan, and product
                recommendations; to pre-fill assessment fields from an uploaded prescription;
                and to fulfil orders you place. Assessment answers are processed by a
                third-party AI provider (OpenAI) solely to generate your report — they are not
                used to train any model.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold">What we don&apos;t do</h2>
              <p className="mt-2 text-muted-foreground">
                We do not sell your health information. We do not share your assessment
                answers or prescription data with anyone other than the service providers
                strictly necessary to generate your report (see above).
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold">Your rights</h2>
              <p className="mt-2 text-muted-foreground">
                You can request a copy of your data or ask us to delete your account and
                associated data by contacting{" "}
                <a href="mailto:support@strengthiva.com" className="text-primary hover:underline">
                  support@strengthiva.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
