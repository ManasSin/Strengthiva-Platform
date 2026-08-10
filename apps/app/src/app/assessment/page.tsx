import { ArrowRight, ClipboardList, FileText, ShieldCheck } from "lucide-react";

import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";
import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow } from "@/components/ui/label";

// "Choose your starting point" — the entry to the three-step flow, sitting just
// ahead of step 1. Matches the backend's dual-entry design (prescription/OCR vs.
// RAG questionnaire, fastapi.md §4/§5).
//
// Restyled for the 2026-08 rebrand. Two things changed beyond colour:
//
//  - The emoji (📄 📊 🚀 🛡) are gone, replaced by the linear lucide set the rest
//    of the system uses. Emoji render as a different typeface per platform and
//    are announced by screen readers as their CLDR name ("bar chart"), neither
//    of which the brand can control.
//  - The two cards no longer carry competing filled CTAs in two different
//    colours. brand-spec.md rule 1 allows one high-value accent CTA per
//    viewport, so the upload path (the shortcut, and the one the reference
//    flow leads with) takes the sage button and the questionnaire path takes
//    the companion treatment.
export default function ChooseAssessmentMethod() {
  return (
    <>
      <MarketingNav />
      <main className="flex-1 bg-leaf-motif">
        <div className="mx-auto max-w-[58.75rem] px-5 py-16 sm:px-7">
          <div className="max-w-[42rem]">
            <Eyebrow>Step 1 of 3 · Getting started</Eyebrow>
            <h1 className="mt-3.5 text-[clamp(1.75rem,4vw,2.375rem)]">
              How would you like to begin?
            </h1>
            <p className="mt-3 max-w-[54ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
              Both paths end in the same place — your Ayurvedic reading and a daily plan built
              around it. Starting from a report you already have just makes the questions
              shorter.
            </p>
          </div>

          <div className="mt-10 grid items-stretch gap-5 md:grid-cols-2">
            <MethodCard
              icon={FileText}
              title="Start with a report you have"
              description="Upload a prescription or lab report and we'll read the key values for you — so the questions that follow are shorter and smarter. Optional, and you can skip it at any point."
              ctaLabel="Upload a report"
              ctaHref="/assessment/upload"
              primary
            />
            <MethodCard
              icon={ClipboardList}
              title="Answer the questions instead"
              description="A structured assessment across constitution, digestion, sleep, energy and any conditions. It adapts as you answer, so you only get the questions that apply to you."
              ctaLabel="Take the assessment"
              ctaHref="/assessment/questionnaire"
            />
          </div>

          <p className="mt-8 flex items-center justify-center gap-2.5 text-sm text-muted-foreground">
            <ShieldCheck className="size-[1.0625rem] shrink-0 text-primary" strokeWidth={1.7} />
            Encrypted on upload · read once · never sold or shared.
          </p>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}

function MethodCard({
  icon: Glyph,
  title,
  description,
  ctaLabel,
  ctaHref,
  primary = false,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  primary?: boolean;
}) {
  return (
    // `flex flex-col` + `mt-auto` on the CTA is what keeps the two buttons on one
    // line no matter how the two descriptions wrap. The previous version relied
    // on the copy happening to be the same length, so the buttons drifted apart
    // vertically at most breakpoints.
    <article className="flex flex-col rounded-lg border border-border bg-background p-7 shadow-hairline">
      <span className="grid size-12 place-items-center rounded-full bg-sage-soft/60 text-primary">
        <Glyph className="size-[1.375rem]" strokeWidth={1.7} />
      </span>
      <h2 className="mt-5 text-subhead">{title}</h2>
      <p className="mt-2.5 text-[0.90625rem] leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-auto flex pt-6">
        <ButtonLink
          href={ctaHref}
          variant={primary ? "default" : "secondary"}
          className="w-full sm:w-auto"
        >
          {ctaLabel}
          <ArrowRight strokeWidth={1.7} />
        </ButtonLink>
      </div>
    </article>
  );
}
