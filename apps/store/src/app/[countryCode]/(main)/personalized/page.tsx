import { Metadata } from "next"

import { getAppURL } from "@lib/util/env"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Personalized Recommendations — Strengthiva",
  description:
    "Strengthiva's free assessment reads your constitution, digestion, sleep, energy and conditions, then suggests a plan.",
}

/*
  personalized-shopping.html from the handoff — the store's explainer for the
  assessment, which itself lives on app.strengthiva.com (NEXT_PUBLIC_APP_URL).
  The prototype pointed at strengthiva.com; the real assessment is the app.
*/
export default function PersonalizedPage() {
  const appUrl = getAppURL()
  const host = appUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")

  return (
    <>
      <section className="section hero-center" style={{ maxWidth: 640 }}>
        <div className="container">
          <p className="eyebrow center">Optional · separate from the store</p>
          <h1 className="h1" style={{ fontSize: "clamp(32px,4.4vw,52px)" }}>
            A doctor, a diagnosis, then the medicine
          </h1>
          <p className="lead center" style={{ margin: "16px auto 0" }}>
            Strengthiva&apos;s free assessment reads your constitution, digestion, sleep, energy and
            conditions, then hands you a daily diet plan and — only if it fits — a shortlist from the
            same product range you just browsed.
          </p>
          <div className="hero-cta" style={{ justifyContent: "center", marginTop: 26 }}>
            <a href={appUrl} className="btn btn-primary" target="_blank" rel="noopener">
              Start the free assessment ↗
            </a>
            <LocalizedClientLink href="/store" className="btn btn-ghost">
              Skip — shop products directly
            </LocalizedClientLink>
          </div>
          <p className="field-hint center" style={{ marginTop: 14 }}>
            Opens Strengthiva&apos;s assessment at {host}. Free, takes about 3 minutes, no card required.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="panel" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
            <p className="h3" style={{ fontSize: 15, marginBottom: 8 }}>
              This is wellness and education, not a diagnosis
            </p>
            <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.65 }}>
              The assessment and any resulting plan are reviewed by Ayurvedic practitioners, but they are
              not a substitute for medical advice. For any medical decision, symptom that concerns you, or
              condition you&apos;re managing, Strengthiva always points you to a qualified professional
              first.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ maxWidth: "44ch", marginBottom: 40 }}>
            <p className="eyebrow">How it works</p>
            <h2 className="h2">Assessment first, always</h2>
          </div>
          <div className="grid-3">
            <Step n="01" title="Tell us what's going on">
              A structured assessment covering constitution, digestion, sleep, energy and chronic
              conditions. It adapts as you answer.
            </Step>
            <Step n="02" title="Get your Ayurvedic reading">
              Your answers are read against classical diagnostic logic to identify your constitution and
              where it&apos;s currently out of balance.
            </Step>
            <Step n="03" title="See what's suited to you">
              A daily diet plan, plus Strengthiva formulations that fit your reading — each shown with the
              reasoning behind it.
            </Step>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container center">
          <p className="eyebrow center">Your assessment covers</p>
          <div className="row" style={{ justifyContent: "center", flexWrap: "wrap", marginTop: 16, gap: 10 }}>
            {["Constitution", "Digestion", "Sleep", "Energy", "Conditions"].map((t) => (
              <span key={t} className="trait-chip">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band center">
            <h2 style={{ fontSize: "clamp(24px,3.2vw,36px)" }}>Find what your body actually needs</h2>
            <p className="lead center" style={{ margin: "12px auto 22px" }}>
              Free. No card required. Your plan is yours whether or not you ever buy anything.
            </p>
            <a href={appUrl} target="_blank" rel="noopener" className="btn btn-primary">
              Take the assessment ↗
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <p className="eyebrow" style={{ color: "var(--muted)" }}>
        {n}
      </p>
      <h3 style={{ marginTop: 6 }}>{title}</h3>
      <p className="muted" style={{ fontSize: 14.5, marginTop: 8 }}>
        {children}
      </p>
    </div>
  )
}
