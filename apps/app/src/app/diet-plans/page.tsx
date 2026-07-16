import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";
import { ButtonLink } from "@/components/ui/button-link";

export default function DietPlansPage() {
  const steps = [
    {
      title: "Take the Assessment",
      description:
        "Answer questions about your lifestyle, physical health, and goals — or upload an existing prescription and we'll pre-fill what we can.",
    },
    {
      title: "We Determine Your Constitution",
      description:
        "Your answers are analyzed against classical Ayurvedic principles to identify your dominant dosha and current imbalances.",
    },
    {
      title: "Get a Single-Day Diet Plan",
      description:
        "Meal-by-meal food options built around your constitution, dietary preferences, and any chronic conditions you've told us about.",
    },
    {
      title: "Add Recommended Products",
      description:
        "Where relevant, we suggest specific Ayurvedic supplements — add them straight to your cart on store.strengthiva.com.",
    },
  ];

  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h1 className="font-headline text-3xl font-bold text-primary md:text-4xl">
            Personalized Diet Plans
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Every plan is generated from your own health assessment — not a generic
            template. Here&apos;s how it works.
          </p>
        </div>

        <div className="mx-auto max-w-3xl px-6 pb-16">
          <ol className="space-y-6">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-4 rounded-2xl border border-border bg-white p-6">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <h2 className="font-headline text-base font-semibold text-foreground">
                    {step.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <ButtonLink href="/assessment" variant="secondary" size="lg">
              Start Your Free Assessment
            </ButtonLink>
            <ButtonLink href="/sample-plan" variant="outline" size="lg">
              View Sample Plan
            </ButtonLink>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
