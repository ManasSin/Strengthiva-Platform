import type { Metadata } from "next";
import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";
import { ButtonLink } from "@/components/ui/button-link";

// About page — written against docs/marketing material/
// Strengthiva-Brand-Foundation-Final.pptx, which supersedes the v3 PDF in the same
// folder (slide 6: the whole-plant / AYUSH-first lead was deliberately set aside in
// favour of the personalised, doctor-led spine).
//
// Every claim here traces to that deck. Claims deliberately NOT made, because the
// deck flags them as unconfirmed or the product doesn't do them yet:
//   - No certification badges. Slide 31 leaves open whether the SKUs are licensed as
//     AYUSH medicines or registered as FSSAI nutraceuticals, and that determines what
//     may legally be claimed.
//   - No SKU count. The discovery briefing says 16; Medusa has 14 seeded.
//   - No cure language anywhere. Slide 31: the Drugs and Magic Remedies Act, the ASCI
//     code and AYUSH advertising norms all apply, and every claim must be substantiable.
//   - No founder origin story. The briefing records it as still uncaptured ("this is
//     the most important section... we don't have it yet"), so there is a deliberate
//     gap below rather than an invented narrative.
export const metadata: Metadata = {
  title: "About Strengthiva",
  description:
    "A doctor, a diagnosis, then the medicine. Why Strengthiva starts with an assessment instead of a shelf.",
};

export default function AboutPage() {
  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <AboutHero />
        <ThePosition />
        <Differentiators />
        <TheFounder />
        <HowItWorks />
        <WhatWeWontSay />
        <ClosingCta />
      </main>
      <MarketingFooter />
    </>
  );
}

function AboutHero() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16 text-center md:py-24">
      <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
        About Strengthiva
      </span>
      <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
        A doctor, a diagnosis,{" "}
        <span className="text-secondary">then the medicine.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
        Most Ayurvedic products are sold off a shelf — the same herb to everyone, whatever
        their body is actually doing. Strengthiva starts the other way round. We assess
        you first, and only then talk about what might help.
      </p>
    </section>
  );
}

function ThePosition() {
  return (
    <section className="border-y border-border bg-tertiary/30 py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="font-display text-3xl font-bold text-primary">
          The view we&apos;re built on
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-foreground">
          Modern medicine is built to manage symptoms. Ayurveda works on the cause
          underneath them. That is where Strengthiva focuses.
        </p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          The problem in this category was never Ayurveda. It was how Ayurveda got sold:
          the same herb to everyone, Sanskrit used as decoration, and a promise of no side
          effects that no honest practitioner would make. We think Ayurveda deserves
          better than that — a doctor first, herbs you can trace, formulations true to the
          texts, and the honesty to explain how it actually works.
        </p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          We&apos;re willing to say what symptom-first medicine leaves undone. We say it
          with confidence in Ayurveda, and without contempt for medicine.
        </p>
      </div>
    </section>
  );
}

function Differentiators() {
  // The four structural differentiators, in the deck's own priority order —
  // personalisation leads because it's the one claim a competitor can't reproduce
  // with a better label (slide 6).
  const items = [
    {
      lead: true,
      title: "A diagnosis before a product",
      body: "Dr. Dheeraj sees patients every week, and the formulations come out of that practice. Strengthiva assesses your body before it recommends anything. A better label can't replicate that, which is why we lead with it.",
    },
    {
      title: "Pure Ayurveda, with the proof",
      body: "Classical Ayurveda, with no Western nutraceuticals added to fill out a label. Purity is claimed everywhere in this category. Proof — herb quality, traceable sourcing, documented R&D and QC — is rare.",
    },
    {
      title: "Rooted in the ancient texts",
      body: "Every formulation traces to a classical source: the Charaka Samhita, the Bhavaprakasha, or the Ayurvedic Pharmacopoeia of India. When we name a herb, we can show where it was written down and what it was written for.",
    },
    {
      title: "Ayurveda as a way of life",
      body: "It was never meant to be a pill you take and forget. Strengthiva works alongside how you eat, sleep and move. The formulation is one input; the life around it does the rest. Results come slowly, and they last.",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-bold text-foreground">
          What makes Strengthiva different
        </h2>
        <p className="mt-4 text-muted-foreground">
          Each of these is structural — built into how the brand is formulated, sourced
          and sold, rather than written for a campaign.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.title}
            className={
              item.lead
                ? "rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-7 text-white md:col-span-2"
                : "rounded-2xl border border-border bg-background p-7"
            }
          >
            {item.lead && (
              <span className="inline-flex rounded-full bg-background/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                The lead
              </span>
            )}
            <h3
              className={`font-display text-xl font-bold ${item.lead ? "mt-4" : ""} ${
                item.lead ? "text-white" : "text-foreground"
              }`}
            >
              {item.title}
            </h3>
            <p
              className={`mt-3 leading-relaxed ${
                item.lead ? "text-white/90" : "text-muted-foreground"
              }`}
            >
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TheFounder() {
  return (
    <section className="border-y border-border bg-tertiary/30 py-16 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[2fr_3fr] md:items-center">
        <div>
          {/* Placeholder for Dr. Dheeraj's portrait — the deck's content model puts him
              at the centre of the brand (slide 25, the founder content engine), so this
              is the single highest-value image asset to source. */}
          <div className="aspect-[4/5] w-full rounded-3xl bg-gradient-to-br from-primary to-primary/70" />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            The practice behind the products
          </div>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground">
            Dr. Dheeraj
          </h2>
          <p className="mt-2 text-sm font-medium text-primary">
            Co-founder · Practising Ayurvedic physician, Patna
          </p>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            Strengthiva&apos;s formulations don&apos;t come out of a marketing brief. They
            come out of a working clinic — a doctor seeing patients every week, and
            noticing which classical preparations actually helped which people.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            That&apos;s a different kind of authority from a family-heritage story or a
            founder narrative built after the fact. It also means the assessment
            you&apos;ll take is modelled on the questions a doctor would ask you in
            person — not a quiz written to sell a particular product.
          </p>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "You tell us what's going on",
      body: "A structured assessment covering your constitution, digestion, sleep, energy, chronic conditions and goals. It adapts as you answer — the questions you get depend on what you've already told us.",
    },
    {
      step: "02",
      title: "We read it the way a practitioner would",
      body: "Your answers are read against classical Ayurvedic diagnostic logic to identify your constitution and where it's currently out of balance.",
    },
    {
      step: "03",
      title: "You get a plan, not just a product",
      body: "A daily diet plan built around your reading, and the Strengthiva formulations suited to it — with the reasoning shown, so you can see why each one is there.",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-bold text-foreground">
          How the assessment works
        </h2>
        <p className="mt-4 text-muted-foreground">
          This is the part that makes the rest of it true. Without it, we&apos;d just be
          another brand selling herbs off a shelf.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.step} className="rounded-2xl border border-border bg-background p-7">
            <div className="font-display text-3xl font-bold text-secondary">
              {step.step}
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhatWeWontSay() {
  const promises = [
    {
      title: "We won't promise it's fast",
      body: "Ayurveda works on the cause underneath a symptom, and that takes time. Many people notice digestion settling in ten to fourteen days. That's how the formulations were designed to work.",
    },
    {
      title: "We won't promise it cures anything",
      body: "No Ayurvedic product cures a chronic disease, and any brand telling you otherwise has a regulatory problem as well as an honesty one.",
    },
    {
      title: "We won't say there are no cautions",
      body: "Some herbs carry real cautions — in pregnancy, alongside certain medicines, or with certain conditions. We'd rather name them than pretend they don't exist.",
    },
    {
      title: "We won't diagnose you in a comment",
      body: "We'll happily explain how something works in public. What we won't do is tell an individual what's wrong with them without a proper assessment.",
    },
  ];

  return (
    <section className="border-t border-border bg-primary py-16 text-white md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold">What we won&apos;t tell you</h2>
          <p className="mt-4 text-white/80">
            A brand willing to name a limit earns belief on everything else. In a category
            built on overclaiming, this is the shortest route to being worth trusting.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {promises.map((promise) => (
            <div key={promise.title} className="rounded-2xl bg-background/10 p-6">
              <h3 className="font-display text-lg font-semibold">{promise.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/85">{promise.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16 text-center md:py-20">
      <h2 className="font-display text-3xl font-bold text-foreground">
        Find what your body actually needs
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
        The assessment takes a few minutes. You&apos;ll get your Ayurvedic reading and a
        daily diet plan at the end of it, whether or not you buy anything.
      </p>
      <ButtonLink href="/assessment" variant="default" size="lg" className="mt-8">
        Take the assessment
      </ButtonLink>
    </section>
  );
}
