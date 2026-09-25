import { Metadata } from "next"

import CtaBand from "@modules/common/components/cta-band"

export const metadata: Metadata = {
  title: "About Strengthiva",
  description:
    "Why Strengthiva exists: classical Ayurveda, assessed before it's recommended, with the limits named.",
}

/* about.html from the "store redesign 02" handoff. */
export default function AboutPage() {
  return (
    <>
      <section className="section hero-center" style={{ maxWidth: 640 }}>
        <div className="container">
          <p className="eyebrow center">About Strengthiva</p>
          <h1 className="h1" style={{ fontSize: "clamp(32px,4.2vw,50px)" }}>
            The problem was never Ayurveda
          </h1>
          <p className="lead center" style={{ margin: "16px auto 0" }}>
            It was how Ayurveda got sold — the same herb to everyone, Sanskrit used as decoration, and
            promises of no side effects that no honest practitioner would make.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ maxWidth: "44ch", marginBottom: 32 }}>
            <p className="eyebrow">What we hold ourselves to</p>
            <h2 className="h2">Four things that don&apos;t change</h2>
          </div>
          <div className="grid-4">
            <Pillar title="Personalised">
              We assess the body before we recommend a product. A better label can&apos;t replace that.
            </Pillar>
            <Pillar title="Pure and proven">
              Classical Ayurveda, with no Western nutraceuticals added to fill out a label — purity you
              can trace from herb to bottle.
            </Pillar>
            <Pillar title="Rooted in the texts">
              Every formulation traces to the Charaka Samhita, the Bhavaprakasha, or the Ayurvedic
              Pharmacopoeia of India.
            </Pillar>
            <Pillar title="A way of life">
              Healing is a practice. The formulation is one input — how you eat, sleep and move does the
              rest.
            </Pillar>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2-1">
          <div>
            <p className="eyebrow">We&apos;d rather tell you the limits</p>
            <h2 className="h2" style={{ fontSize: "clamp(24px,3vw,34px)" }}>
              Nothing here cures a chronic disease
            </h2>
            <p className="lead" style={{ marginTop: 14 }}>
              Ayurveda works on the cause underneath a symptom, and that takes time. Many people find
              their digestion settling in ten to fourteen days — that&apos;s how the formulations are
              designed to work. Some herbs carry real cautions we name rather than hide. A brand willing
              to name a limit is worth believing on everything else.
            </p>
          </div>
          <aside className="panel">
            <p className="eyebrow" style={{ color: "var(--green)" }}>
              What we&apos;d write
            </p>
            <p style={{ fontSize: 15, margin: "8px 0 16px" }}>
              &ldquo;Built on Avipattikar churna, a classical formulation from the Bhavaprakasha.
              Traceable herbs, tested batch by batch.&rdquo;
            </p>
            <hr className="rule" style={{ margin: "16px 0" }} />
            <p className="eyebrow" style={{ color: "var(--danger)" }}>
              What we wouldn&apos;t
            </p>
            <p style={{ fontSize: 15, marginTop: 8, color: "var(--danger)" }}>
              &ldquo;Discover the magic of ancient Ayurveda — your gut&apos;s new best friend! Instant
              relief, 100% guaranteed!&rdquo;
            </p>
          </aside>
        </div>
      </section>

      <CtaBand title="Shop the range, or start with the assessment" />
    </>
  )
}

function Pillar({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>
        {children}
      </p>
    </div>
  )
}
