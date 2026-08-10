import {
  BookOpen,
  Check,
  Clock,
  FileText,
  Flame,
  Flower2,
  Heart,
  Leaf,
  Lock,
  ShieldCheck,
  Sprout,
  Stethoscope,
  Upload,
  Users,
  X,
} from "lucide-react";

import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { Botanical } from "@/components/ui/botanical";
import { Eyebrow } from "@/components/ui/label";

// Marketing landing page.
//
// Structure and copy come from docs/redesign/new design style 1.html, which the
// brief names as the accurate reference for this page, cross-checked against
// docs/redesign/landing page redesign.png. Both were themselves written against
// docs/marketing material/Strengthiva-Brand-Foundation-Final.pptx.
//
// The claims discipline from the previous version is unchanged and deliberate:
// nothing here states a certification, a customer count, a SKU count, or a cure.
// An earlier revision carried a "Trusted by 50,000+ Health Seekers" badge for a
// pre-launch brand, an "As Seen In" row of six real mastheads with no coverage
// behind it, a named testimonial, and two certification badges naming bodies
// that don't appear to exist. All were removed rather than reworded — slide 19's
// second voice principle is "honest before flattering", and slide 31 puts this
// under the Drugs and Magic Remedies Act, the ASCI code and AYUSH advertising
// norms, so invented press is a legal exposure and not just off-brand. When real
// proof exists it belongs in TrustBar below; until then that row states only
// things that are true of the product itself.
export default function Home() {
  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <HeroSection />
        <TrustBar />
        <HowItWorksSection />
        <ValuesSection />
        <SamplePlanSection />
        <HonestySection />
        <ClosingCtaSection />
      </main>
      <MarketingFooter />
    </>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative only, and clipped by the section's overflow-hidden so it can
          never widen the page. Sage at low opacity — an accent moment that sits
          behind the content rather than competing with the CTA. */}
      <Botanical className="-right-10 top-5 hidden text-accent/50 lg:block" />
      <div className="mx-auto max-w-measure px-5 pb-[4.5rem] pt-16 sm:px-7">
        <div className="grid items-center gap-11 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <Badge variant="accent">
              <Leaf className="text-primary" strokeWidth={1.7} />
              Ayurveda that starts with you, not a shelf
            </Badge>
            <h1 className="mt-5 text-[clamp(2.75rem,6vw,4.5rem)] leading-[1.04] tracking-[-0.03em]">
              A doctor, a diagnosis,
              <br />
              <em className="italic text-primary">then the medicine.</em>
            </h1>
            <p className="mt-5 max-w-[56ch] text-[1.125rem] leading-relaxed text-muted-foreground">
              Modern medicine is built to manage symptoms. Ayurveda works on the cause
              underneath them. Take the assessment and understand what your body is actually
              asking for — before anyone sells you anything.
            </p>

            {/* One filled CTA, one companion. `items-center` on the row (not
                `items-baseline`) is what keeps the two pills' centre lines
                level once they wrap onto different widths. */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <ButtonLink href="/assessment" variant="default">
                Start the assessment
                <ArrowGlyph />
              </ButtonLink>
              <ButtonLink href="/sample-plan" variant="secondary">
                See a sample plan
              </ButtonLink>
            </div>

            <p className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
              <span aria-hidden className="flex">
                {[Leaf, Flower2, Sprout].map((Glyph, i) => (
                  <span
                    key={i}
                    className="-ml-2 grid size-7 place-items-center rounded-full border-2 border-background bg-surface-2 text-primary first:ml-0"
                  >
                    <Glyph className="size-3.5" strokeWidth={1.7} />
                  </span>
                ))}
              </span>
              Reviewed by Ayurvedic practitioners · Evidence-based, no card required
            </p>
          </div>

          <HeroReadingPreview />
        </div>
      </div>
    </section>
  );
}

/**
 * A still of the assessment, one question in. Decorative in the sense that it
 * isn't interactive, but it is the clearest statement of what the product does,
 * so it's real markup rather than a screenshot: it stays crisp, it reflows on
 * small screens, and the copy inside it is selectable and translatable.
 */
function HeroReadingPreview() {
  const options = [
    { icon: Check, title: "Excellent", note: "Light and energetic after meals", selected: false },
    { icon: Flame, title: "Good, with the odd bloat", note: "Occasional heaviness", selected: true },
    { icon: Flame, title: "Frequent discomfort", note: "Acidity or irregularity", selected: false },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[27.5rem] lg:mx-0 lg:max-w-none">
      <div className="relative z-10 rounded-xl border border-border bg-background p-6 shadow-lifted">
        <div className="mb-4 flex items-center justify-between">
          <Eyebrow className="text-muted-foreground">Step 2 of 5 · Digestion</Eyebrow>
          <span aria-hidden className="flex gap-1.5">
            {[true, true, false, false, false].map((on, i) => (
              <i
                key={i}
                className={`size-[0.4375rem] rounded-full ${on ? "bg-accent" : "bg-border"}`}
              />
            ))}
          </span>
        </div>
        <p className="font-display text-[1.4375rem] leading-tight">
          How would you describe your digestion?
        </p>
        <p className="mb-4 mt-1 text-[0.84375rem] text-muted-foreground">
          This helps us read your <em className="italic">agni</em> — your digestive fire.
        </p>
        <ul className="space-y-2.5">
          {options.map(({ icon: Glyph, title, note, selected }) => (
            <li
              key={title}
              className={`flex items-center gap-3 rounded-md border p-3.5 ${
                selected
                  ? "border-primary bg-surface shadow-[inset_0_0_0_1px_var(--brand-primary)]"
                  : "border-border"
              }`}
            >
              <Glyph className="size-5 shrink-0 text-primary" strokeWidth={1.7} />
              <span className="min-w-0">
                <b className="block text-[0.90625rem] font-semibold">{title}</b>
                <span className="text-[0.78125rem] text-muted-foreground">{note}</span>
              </span>
              {selected && (
                <Check className="ml-auto size-5 shrink-0 text-primary" strokeWidth={1.7} />
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Overlaps the card corner on wide screens and stacks underneath on
          narrow ones. Absolute is right here — it's a decorative overlap with no
          content below it to displace — but it's scoped to `lg:` so it never
          overlaps text on a phone. */}
      <div className="mt-3.5 rounded-lg border border-border bg-background p-4 shadow-soft lg:absolute lg:-bottom-6 lg:-right-6 lg:z-20 lg:mt-0 lg:w-[14.75rem]">
        <Eyebrow className="mb-2.5 block text-muted-foreground">Your reading covers</Eyebrow>
        <div className="flex flex-wrap gap-1.5">
          {["Constitution", "Digestion", "Sleep", "Energy", "Conditions"].map((tag) => (
            <Badge key={tag} size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Trust bar ────────────────────────────────────────────────────────────── */

function TrustBar() {
  const items = [
    {
      icon: Lock,
      title: "End-to-end encrypted",
      body: "Your health data is never sold or shared",
    },
    {
      icon: Stethoscope,
      title: "Reviewed by practitioners",
      body: "Every reading validated by Ayurvedic doctors",
    },
    {
      icon: BookOpen,
      title: "Rooted in the classical texts",
      body: "Charaka Samhita to the Bhavaprakasha",
    },
    {
      icon: ShieldCheck,
      title: "Educational, not diagnostic",
      body: "We explain and guide; a doctor decides",
    },
  ];

  return (
    <section className="border-y border-hairline-soft bg-surface">
      <div className="mx-auto grid max-w-measure gap-6 px-5 py-7 sm:grid-cols-2 sm:px-7 lg:grid-cols-4">
        {items.map(({ icon: Glyph, title, body }) => (
          <div key={title} className="flex gap-3">
            <Glyph className="mt-0.5 size-[1.375rem] shrink-0 text-primary" strokeWidth={1.7} />
            <div>
              <b className="block text-[0.90625rem] font-semibold">{title}</b>
              <span className="text-[0.8125rem] text-muted-foreground">{body}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── How it works ─────────────────────────────────────────────────────────── */

function HowItWorksSection() {
  const steps = [
    {
      n: "01",
      icon: FileText,
      title: "Tell us what's going on",
      body: "A structured assessment across constitution, digestion, sleep, energy and any conditions. It adapts as you answer, so you only get the questions that apply to you.",
    },
    {
      n: "02",
      icon: Stethoscope,
      title: "Get your Ayurvedic reading",
      body: "Your answers are read against classical diagnostic logic to identify your constitution and where it's currently out of balance — reviewed by real practitioners.",
    },
    {
      n: "03",
      icon: Flower2,
      title: "See what's suited to you",
      body: "A daily diet plan built around that reading, plus the formulations that fit — each one shown with the reasoning behind it, and only when it's genuinely needed.",
    },
  ];

  return (
    <section id="how" className="mx-auto max-w-measure px-5 py-section sm:px-7">
      <div className="mb-11 max-w-[40rem]">
        <hr className="rule-accent mb-6" />
        <Eyebrow>Our process · Assessment first, always</Eyebrow>
        <h2 className="mt-3.5 text-[clamp(1.875rem,4vw,2.5rem)]">
          First the reading,
          <br />
          {/* The one highlighted phrase on the page. Sage sits behind the
              words, never in them — see .mark-accent in globals.css. */}
          then <span className="mark-accent">the remedy.</span>
        </h2>
        <p className="mt-3 max-w-[56ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
          It&rsquo;s the same order a good doctor works in — understand the body, then decide
          what it needs. Nothing here is recommended before we&rsquo;ve read you.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {steps.map(({ n, icon: Glyph, title, body }) => (
          <article
            key={n}
            className="rounded-lg border border-border bg-background p-6 transition-[box-shadow,transform] duration-200 hover:shadow-soft motion-safe:hover:-translate-y-0.5"
          >
            {/* The step number's trailing rule is drawn in sage rather than the
                grey hairline — a small, repeated accent that ties the three
                cards together as one sequence. */}
            <div className="mb-4 flex items-center gap-2.5 font-display text-[0.9375rem] font-medium text-primary">
              {n}
              <span aria-hidden className="h-px flex-1 bg-accent" />
            </div>
            <Glyph className="mb-3.5 size-[1.625rem] text-primary" strokeWidth={1.7} />
            <h3 className="mb-2 text-subhead">{title}</h3>
            <p className="text-[0.90625rem] leading-relaxed text-muted-foreground">{body}</p>
          </article>
        ))}
      </div>

      <p className="mt-6 flex items-center gap-2.5 text-sm text-muted-foreground">
        <Upload className="size-[1.0625rem] shrink-0 text-primary" strokeWidth={1.7} />
        Already have a lab report? Upload it first and the questions get shorter — it&rsquo;s an
        optional head start, never a barrier.
      </p>
    </section>
  );
}

/* ── Values ───────────────────────────────────────────────────────────────── */

function ValuesSection() {
  const values = [
    {
      icon: Users,
      title: "Personalised",
      body: "We read your body before we mention a product. A better label can't replace that.",
    },
    {
      icon: Leaf,
      title: "Pure and proven",
      body: "Classical Ayurveda with no Western nutraceuticals slipped in — traceable herb to bottle.",
    },
    {
      icon: BookOpen,
      title: "Rooted in the texts",
      body: "Every formulation traces to the Charaka Samhita, the Bhavaprakasha, or the Ayurvedic Pharmacopoeia.",
    },
    {
      icon: Heart,
      title: "A way of life",
      body: "The formulation is one input. How you eat, sleep and move does the rest.",
    },
  ];

  return (
    <section id="values" className="bg-surface">
      <div className="mx-auto max-w-measure px-5 py-section sm:px-7">
        <div className="mb-11 max-w-[40rem]">
          <hr className="rule-accent mb-6" />
          <Eyebrow>What we hold ourselves to</Eyebrow>
          <h2 className="mt-3.5 text-[clamp(1.875rem,4vw,2.5rem)]">
            The standards behind every reading.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Glyph, title, body }) => (
            <article key={title} className="rounded-md border border-border bg-background p-6">
              {/* Sage-soft well behind each icon — the accent marking what a
                  section is *about*, at a weight that can repeat four times
                  without shouting. */}
              <span className="mb-4 grid size-11 place-items-center rounded-full bg-sage-soft/60 text-primary">
                <Glyph className="size-[1.375rem]" strokeWidth={1.7} />
              </span>
              <h3 className="mb-2 text-[1.1875rem]">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Sample plan preview ──────────────────────────────────────────────────── */

function SamplePlanSection() {
  const cells = [
    { k: "Morning", v: "Warm water · a short walk", why: "Wakes agni gently" },
    { k: "Breakfast", v: "Oats, soaked almonds, seeds", why: "Steady energy, easy to digest" },
    { k: "Lunch", v: "Rice, dal, sabzi, ghee", why: "Your strongest digestive window" },
    { k: "Evening", v: "Herbal tea · light movement", why: "Cools an active afternoon" },
    { k: "Dinner", v: "Moong khichdi, steamed veg", why: "Light before sleep" },
    { k: "Be mindful of", v: "Cold drinks · fried, late meals", why: "Aggravates the imbalance we read" },
  ];

  return (
    <section id="sample" className="mx-auto max-w-measure px-5 py-section sm:px-7">
      <div className="grid items-center gap-11 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <hr className="rule-accent mb-6" />
          <Eyebrow>See an example</Eyebrow>
          <h2 className="mb-3.5 mt-3.5 text-[clamp(1.875rem,4vw,2.5rem)]">
            What your personal plan looks like.
          </h2>
          <p className="mb-7 max-w-[56ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
            Understanding first, diet second, products last — and only if they earn their
            place. Yours will differ, because it&rsquo;s built around your reading, not a
            template.
          </p>
          <ButtonLink href="/sample-plan" variant="link">
            Open a full sample plan →
          </ButtonLink>
        </div>

        <div className="overflow-hidden rounded-lg border border-border shadow-soft">
          <div className="on-forest flex items-center justify-between bg-forest px-6 py-4 text-surface">
            <Eyebrow>A day, built for Vata–Pitta</Eyebrow>
            <b className="font-display text-[1.125rem] font-normal">Sample</b>
          </div>
          {/* 1px gaps over a hairline background give the cell seams without
              doubled borders — brand-spec rule 2's "clean horizontal and
              vertical lines". */}
          <div className="grid gap-px bg-hairline-soft sm:grid-cols-2 lg:grid-cols-3">
            {cells.map(({ k, v, why }) => (
              <div key={k} className="bg-background p-[1.125rem]">
                <div className="mb-2 font-mono text-label uppercase text-primary">{k}</div>
                <div className="text-sm font-medium">{v}</div>
                <div className="mt-1.5 text-[0.78125rem] text-muted-foreground">{why}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-surface px-6 py-4 text-[0.8125rem] text-muted-foreground">
            <ShieldCheck className="size-[0.9375rem] shrink-0 text-primary" strokeWidth={1.7} />
            Educational guidance — not a medical diagnosis.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Honesty ──────────────────────────────────────────────────────────────── */

function HonestySection() {
  const will = [
    "Foods and daily routines that suit your reading",
    "Evidence-backed, traceable herbs — tested batch by batch",
    "Strengthiva formulations, only if the reading calls for one",
    "A clear reason behind every food, habit and herb",
  ];
  const wont = [
    "Instant cures or “magic pill” results",
    "The same solution for everyone",
    "Shortcuts to long-term health",
    "Anything dressed up as a diagnosis",
  ];

  return (
    <section id="honesty" className="bg-surface">
      <div className="mx-auto max-w-measure px-5 py-section sm:px-7">
        <div className="grid items-start gap-11 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <hr className="rule-accent mb-6" />
            <Eyebrow>Where we stand</Eyebrow>
            <h2 className="mb-4 mt-3.5 text-[clamp(1.875rem,4vw,2.5rem)]">
              We&rsquo;d rather tell you the limits.
            </h2>
            <p className="mb-4 max-w-[56ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
              Ayurveda works on the cause underneath a symptom, and that takes time. Many
              people find their digestion settling in ten to fourteen days — that&rsquo;s how
              the formulations were designed to work.
            </p>
            <p className="max-w-[56ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
              Nothing here cures a chronic disease, and some herbs carry real cautions
              we&rsquo;ll name rather than hide. A brand willing to name a limit is worth
              believing on everything else.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="p-6">
              <Eyebrow className="mb-3.5 block">What we&rsquo;ll recommend</Eyebrow>
              <ul className="space-y-2.5">
                {will.map((item) => (
                  <li key={item} className="flex gap-3 text-[0.90625rem]">
                    <Check className="mt-0.5 size-[1.125rem] shrink-0 text-primary" strokeWidth={1.7} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-hairline-soft p-6">
              <Eyebrow className="mb-3.5 block text-destructive">
                What we won&rsquo;t promise
              </Eyebrow>
              <ul className="space-y-2.5">
                {wont.map((item) => (
                  <li key={item} className="flex gap-3 text-[0.90625rem] text-muted-foreground">
                    <X className="mt-0.5 size-[1.125rem] shrink-0 text-destructive" strokeWidth={1.7} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Closing CTA band ─────────────────────────────────────────────────────── */

function ClosingCtaSection() {
  const meta = [
    { icon: Clock, label: "Takes a few minutes" },
    { icon: Users, label: "Personalised to you" },
    { icon: Stethoscope, label: "Practitioner-reviewed" },
  ];

  return (
    <section className="mx-auto max-w-measure px-5 py-section sm:px-7">
      {/* `on-forest` swaps the eyebrow to sage and the focus ring to sage — the
          brand green loses its contrast against #15201A. */}
      <div className="on-forest relative overflow-hidden rounded-xl bg-forest px-6 py-12 text-surface sm:px-14 sm:py-14">
        <Botanical className="-bottom-16 right-5 hidden text-primary/40 sm:block" />
        <div className="relative">
          <Eyebrow>Free · no card required</Eyebrow>
          <h2 className="mt-3 max-w-[16ch] text-[clamp(1.875rem,4vw,2.625rem)] text-white">
            Find what your body actually needs.
          </h2>
          <p className="mb-7 mt-3.5 max-w-[44ch] leading-relaxed text-surface/75">
            Take the assessment and get your Ayurvedic reading plus a daily diet plan built
            around it. Your plan is yours whether or not you ever buy anything.
          </p>
          <ButtonLink href="/assessment" variant="onforest">
            Take the assessment
            <ArrowGlyph />
          </ButtonLink>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[0.8125rem] text-surface/70">
            {meta.map(({ icon: Glyph, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Glyph className="size-[0.9375rem] text-accent" strokeWidth={1.7} />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** The CTA arrow. A glyph, not an icon component — it carries no meaning the
 *  button label doesn't already state, so it stays out of the accessibility tree. */
function ArrowGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12h15m0 0-6-6m6 6-6 6"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
