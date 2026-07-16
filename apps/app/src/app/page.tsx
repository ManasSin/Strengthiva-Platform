import { MarketingNav } from "@/components/layout/nav";
import { MarketingFooter } from "@/components/layout/footer";
import { ButtonLink } from "@/components/ui/button-link";

// Marketing landing page — ported from the Figma "Strengthiva - Home" export
// (docs/figma exports/Strengthiva - Home.png), reviewed in
// docs/platform-architecture/modules/app-frontend.md §1.
export default function Home() {
  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <HeroSection />
        <TrustBadgesSection />
        <ValuePropsSection />
        <TestimonialSection />
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
            Trusted by 50,000+ Health Seekers
          </span>
          <h1 className="mt-6 font-headline text-4xl font-bold leading-tight text-foreground md:text-5xl">
            Revolutionizing your lifestyle with{" "}
            <span className="text-secondary">Ayurvedic Wisdom</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Tailored wellness for the modern professional. Achieve peak vitality with
            personalized rituals that fit your busy schedule, backed by 5,000 years of
            tradition.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <ButtonLink href="/assessment" variant="secondary" size="lg">
              Start Your Free Assessment →
            </ButtonLink>
            <ButtonLink href="/sample-plan" variant="outline" size="lg">
              View Sample Plan
            </ButtonLink>
          </div>
        </div>
        <div className="relative">
          {/* Placeholder for the hero photo (person with tea, per Figma) — real
              asset not yet available; a gradient panel holds the layout/aspect
              ratio until one is provided. */}
          <div className="aspect-[4/5] w-full rounded-3xl bg-gradient-to-br from-primary to-primary/70" />
          <div className="absolute -bottom-6 left-6 right-6 rounded-2xl bg-white p-4 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
              <span aria-hidden>⚡</span> Daily Vitality
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full w-[85%] rounded-full bg-secondary" />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">85% Energy Optimized Today</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBadgesSection() {
  const badges = ["BAMS Global", "Ayush Certified", "Vedic Council", "HerbSafe India"];
  return (
    <section className="border-y border-border bg-tertiary/30 py-10">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Guided by Professional Ayurvedic Expertise
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-medium text-foreground">
          {badges.map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ValuePropsSection() {
  const cards = [
    {
      title: "Expert Consultation",
      description:
        "Direct access to certified BAMS Ayurvedic doctors who understand the challenges of a corporate lifestyle.",
      bullets: ["1-on-1 Video Calls", "Personal Dosha Analysis"],
    },
    {
      title: "AI-Driven Symptom Test",
      description:
        "Our proprietary algorithm analyzes your symptoms in minutes to identify underlying imbalances.",
      bullets: ["3-Minute Assessment", "Real-time Health Insights"],
    },
    {
      title: "Personalized Diet",
      description:
        "Meal plans and supplement stacks delivered to your door, curated for your specific body type.",
      bullets: ["Weekly Meal Curation", "High-Potency Herbs"],
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-headline text-3xl font-bold text-primary">
          Precision Wellness for Busy Lives
        </h2>
        <p className="mt-4 text-muted-foreground">
          We combine ancient herbal intelligence with modern data science to create a
          blueprint for your health that actually works.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-border bg-white p-6">
            <h3 className="font-headline text-lg font-semibold text-foreground">{card.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              {card.bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2">
                  <span className="text-primary" aria-hidden>
                    ✓
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function TestimonialSection() {
  const pressLogos = ["VOGUE", "FORBES", "ET HEALTH", "GQ INDIA", "MINT", "NDTV"];
  return (
    <section className="bg-tertiary/30 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2">
        <div>
          <h2 className="font-headline text-xl font-semibold text-foreground">
            Trusted by Modern Achievers
          </h2>
          <blockquote className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-foreground">
              &ldquo;Strengthiva&apos;s personalized diet plan helped me regain my focus
              during long board meetings. The morning rituals are simple yet incredibly
              effective for my busy schedule.&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20" />
              <div>
                <div className="text-sm font-semibold text-foreground">Rajesh Mehta</div>
                <div className="text-xs text-muted-foreground">VP, Tech Solutions</div>
              </div>
            </div>
          </blockquote>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            As Seen In
          </div>
          <div className="mt-6 grid grid-cols-3 gap-6 text-sm font-semibold text-foreground/70">
            {pressLogos.map((logo) => (
              <span key={logo}>{logo}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ClosingCtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 py-14 text-center text-white">
        <h2 className="font-headline text-3xl font-bold">
          Your Path to Holistic Strength Starts Here
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/90">
          Take our 3-minute Dosha assessment and receive a personalized wellness plan
          designed for your unique physiology.
        </p>
        <ButtonLink href="/assessment" variant="secondary" size="lg" className="mt-8">
          Start Your Free Assessment
        </ButtonLink>
        <p className="mt-3 text-xs text-white/70">No credit card required. BAMS doctor reviewed.</p>
      </div>
    </section>
  );
}
