import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";
import { ButtonLink } from "@/components/ui/button-link";

// Marketing landing page. Rewritten 2026-07-22 against docs/marketing material/
// Strengthiva-Brand-Foundation-Final.pptx (which supersedes the v3 PDF beside it).
//
// The previous version was a direct port of the Figma "Strengthiva - Home" export and
// carried placeholder social proof that had hardened into fabricated claims — a
// "Trusted by 50,000+ Health Seekers" badge for a pre-launch brand, an "As Seen In"
// row of six real mastheads (Vogue, Forbes, NDTV…) with no coverage behind it, a named
// customer testimonial, and two certification badges naming bodies that don't appear
// to exist ("Vedic Council", "HerbSafe India"). All removed rather than reworded.
// Slide 19's second voice principle is "honest before flattering", and slide 31 puts
// this under the Drugs and Magic Remedies Act, the ASCI code and AYUSH advertising
// norms — invented press and testimonials are a legal exposure, not just off-brand.
//
// It also described product that doesn't exist: 1-on-1 video calls with BAMS doctors,
// and weekly meal curation (the report generates a single-day diet plan — see
// src/app/report/[id]/page.tsx).
//
// Nothing here claims a certification, a customer count, a SKU count, or a cure. When
// real proof exists — AYUSH/FSSAI classification confirmed per slide 31, actual press,
// actual customers — it belongs in TrustSection and ProofSection below.
export default function Home() {
  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <PillarsSection />
        <HonestySection />
        <ClosingCtaSection />
      </main>
      <MarketingFooter />
    </>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Ayurveda that starts with you, not a shelf
          </span>
          <h1 className="mt-6 font-headline text-4xl font-bold leading-tight text-foreground md:text-5xl">
            A doctor, a diagnosis,{" "}
            <span className="text-secondary">then the medicine.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Modern medicine is built to manage symptoms. Ayurveda works on the cause
            underneath them. Take the assessment and find out what your body is actually
            asking for — before anyone sells you anything.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <ButtonLink href="/assessment" variant="secondary" size="lg">
              Take the assessment →
            </ButtonLink>
            <ButtonLink href="/sample-plan" variant="outline" size="lg">
              See a sample plan
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Free, takes a few minutes. You get your reading and a diet plan either way.
          </p>
        </div>
        <div className="relative">
          {/* Placeholder for the hero image — real asset not yet available; a gradient
              panel holds the layout/aspect ratio until one is provided. Per slide 25
              the strongest option here is Dr. Dheeraj in the clinic, not stock wellness
              photography: the practice is the proof. */}
          <div className="aspect-[4/5] w-full rounded-3xl bg-gradient-to-br from-primary to-primary/70" />
          <div className="absolute -bottom-6 left-6 right-6 rounded-2xl bg-white p-5 shadow-lg">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your assessment covers
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Constitution", "Digestion", "Sleep", "Energy", "Conditions"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-tertiary px-3 py-1 text-xs font-medium text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="border-y border-border bg-tertiary/30 py-16">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-headline text-3xl font-bold text-primary">
          The problem was never Ayurveda
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-foreground">
          It was how Ayurveda got sold. The same herb to everyone. Sanskrit used as
          decoration. And a promise of no side effects that no honest practitioner would
          make.
        </p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          You&apos;ve probably already tried a multivitamin, a probiotic, someone&apos;s
          triphala, a wellness juice. If none of it felt like the answer, it may be
          because none of it was chosen for you.
        </p>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Tell us what's going on",
      body: "A structured assessment — constitution, digestion, sleep, energy, chronic conditions, goals. It adapts as you answer, so you only get the questions that apply to you.",
    },
    {
      step: "02",
      title: "Get your Ayurvedic reading",
      body: "Your answers are read against classical diagnostic logic to identify your constitution and where it's currently out of balance.",
    },
    {
      step: "03",
      title: "See what's actually suited to you",
      body: "A daily diet plan built around that reading, plus the Strengthiva formulations that fit it — each one shown with the reasoning behind it.",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-headline text-3xl font-bold text-foreground">
          Assessment first. Always.
        </h2>
        <p className="mt-4 text-muted-foreground">
          It&apos;s the same order a doctor would work in — understand the body, then
          decide what it needs.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.step} className="rounded-2xl border border-border bg-white p-7">
            <div className="font-headline text-3xl font-bold text-secondary">
              {step.step}
            </div>
            <h3 className="mt-3 font-headline text-lg font-semibold text-foreground">
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

function PillarsSection() {
  const pillars = [
    {
      title: "Personalised",
      body: "We assess your body before we recommend a product. A better label can't replicate that.",
    },
    {
      title: "Pure and proven",
      body: "Classical Ayurveda, with no Western nutraceuticals added to fill out a label — and purity you can trace from the herb to the bottle.",
    },
    {
      title: "Rooted in the texts",
      body: "Every formulation traces to the Charaka Samhita, the Bhavaprakasha, or the Ayurvedic Pharmacopoeia of India. Written down centuries ago, not made up for a label.",
    },
    {
      title: "A way of life",
      body: "Healing is a practice. The formulation is one input — how you eat, sleep and move does the rest.",
    },
  ];

  return (
    <section className="border-y border-border bg-tertiary/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-headline text-3xl font-bold text-primary">
            What we hold ourselves to
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="rounded-2xl bg-white p-6">
              <h3 className="font-headline text-lg font-semibold text-foreground">
                {pillar.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HonestySection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="font-headline text-3xl font-bold text-foreground">
            We&apos;d rather tell you the limits
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            Ayurveda works on the cause underneath a symptom, and that takes time. Many
            people find their digestion settling in ten to fourteen days — that&apos;s how
            the formulations were designed to work. Nothing here cures a chronic disease,
            and some herbs carry real cautions we&apos;ll name rather than hide.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            A brand willing to name a limit is worth believing on everything else.
          </p>
          <ButtonLink href="/about" variant="outline" size="lg" className="mt-7">
            Read what we stand for
          </ButtonLink>
        </div>
        <div className="rounded-3xl border border-border bg-white p-8">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            How we talk about our products
          </div>
          <div className="mt-5 space-y-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                What we&apos;d write
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                &ldquo;Built on Avipattikar churna, a classical formulation from the
                Bhavaprakasha. Traceable herbs, tested batch by batch.&rdquo;
              </p>
            </div>
            <div className="border-t border-border pt-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What we wouldn&apos;t
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-through decoration-secondary/60">
                &ldquo;Discover the magic of ancient Ayurveda — your gut&apos;s new best
                friend! Instant relief, 100% guaranteed!&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClosingCtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 py-14 text-center text-white">
        <h2 className="font-headline text-3xl font-bold">
          Find what your body actually needs
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/90">
          Take the assessment and get your Ayurvedic reading and a daily diet plan built
          around it.
        </p>
        <ButtonLink href="/assessment" variant="secondary" size="lg" className="mt-8">
          Take the assessment
        </ButtonLink>
        <p className="mt-3 text-xs text-white/70">
          Free. No card required. Your plan is yours whether or not you buy anything.
        </p>
      </div>
    </section>
  );
}