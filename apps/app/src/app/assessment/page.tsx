import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";
import { ButtonLink } from "@/components/ui/button-link";

// "Choose Assessment Method" — ported from the Figma export of the same name,
// reviewed in docs/platform-architecture/modules/app-frontend.md §2. Matches the
// backend's existing dual-entry design (prescription/OCR vs. RAG questionnaire,
// fastapi.md §4/§5) exactly — no reconciliation needed here.
export default function ChooseAssessmentMethod() {
  return (
    <>
      <MarketingNav />
      <main className="flex-1 bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h1 className="font-headline text-3xl font-bold text-primary md:text-4xl">
            How would you like to be assisted today?
          </h1>
          <p className="mt-4 text-muted-foreground">
            Your journey to Modern Ayurvedic Wellness begins with a single choice.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <MethodCard
              icon="📄"
              iconBg="bg-primary/10"
              title="Upload Existing Prescription"
              description="Have a doctor's note? Upload it and our experts will suggest the right diet and products tailored specifically to your medical advice."
              ctaLabel="Upload File"
              ctaHref="/assessment/upload"
              ctaVariant="default"
              ctaIcon="📤"
              accent="text-primary"
            />
            <MethodCard
              icon="📊"
              iconBg="bg-secondary/10"
              title="Take Our Health Assessment Test"
              description="Deep-symptom AI test to understand your body type (Dosha) and health needs. A comprehensive digital diagnostic for modern healing."
              ctaLabel="Start Test"
              ctaHref="/assessment/questionnaire"
              ctaVariant="secondary"
              ctaIcon="🚀"
              accent="text-secondary"
            />
          </div>

          <div className="mx-auto mt-10 inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm text-foreground">
            <span className="text-primary" aria-hidden>
              🛡
            </span>
            Safe, secure, and confidential. Your medical data is encrypted.
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}

function MethodCard({
  icon,
  iconBg,
  title,
  description,
  ctaLabel,
  ctaHref,
  ctaVariant,
  ctaIcon,
  accent,
}: {
  icon: string;
  iconBg: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: "default" | "secondary";
  ctaIcon: string;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-white p-8 text-left">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${iconBg} text-2xl`}>
        <span aria-hidden>{icon}</span>
      </div>
      <h2 className={`mt-6 text-center font-headline text-xl font-bold ${accent}`}>{title}</h2>
      <p className="mt-3 text-center text-sm text-muted-foreground">{description}</p>
      <ButtonLink href={ctaHref} variant={ctaVariant} className="mt-6 w-full">
        <span aria-hidden>{ctaIcon}</span> {ctaLabel}
      </ButtonLink>
    </div>
  );
}
