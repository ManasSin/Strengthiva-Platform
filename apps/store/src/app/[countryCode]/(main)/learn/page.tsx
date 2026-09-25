import { Metadata } from "next"

import CtaBand from "@modules/common/components/cta-band"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Learn Ayurveda — Strengthiva",
  description:
    "Short, honest explainers on the herbs and ideas behind Strengthiva's formulations.",
}

/*
  learn.html from the handoff. Links that named the prototype's invented
  "Digestive Health" category point at the real "Gut Health" one.
*/
const ENTRIES: {
  kind: "INGREDIENT" | "CONCEPT"
  title: string
  body: string
  link?: { href: string; label: string }
}[] = [
  {
    kind: "INGREDIENT",
    title: "Ashwagandha — the rejuvenative",
    body: "Classical texts describe Ashwagandha (Withania somnifera) as a rasayana — taken over time to build resilience, not a single-dose fix. It appears in Strengthiva's Joint Health range.",
    link: { href: "/categories/joint-health", label: "Shop Joint Health" },
  },
  {
    kind: "INGREDIENT",
    title: "Haridra (Turmeric) — the everyday staple",
    body: "A staple of home Ayurveda for digestion and detox. Strengthiva sources it the same way as every ingredient: traceable, tested batch by batch.",
    link: { href: "/categories/gut-health", label: "Shop Gut Health" },
  },
  {
    kind: "INGREDIENT",
    title: "Tulsi — the household herb",
    body: "One of the most-used plants in home Ayurveda, and the base of Tulsi Drops in Strengthiva's Respiratory Health range.",
    link: { href: "/categories/respiratory-health", label: "Shop Respiratory Health" },
  },
  {
    kind: "CONCEPT",
    title: "What is Agni?",
    body: "Agni is the classical idea of digestive fire — how well the body processes food and, by extension, everything else. Several formulations, including Agnivita, are built around supporting it.",
  },
  {
    kind: "CONCEPT",
    title: "Constitution, in plain language",
    body: "Ayurveda treats each person's baseline — their constitution — as different, which is the whole argument for personalization instead of one product for everyone.",
    link: { href: "/personalized", label: "Find your constitution" },
  },
]

export default function LearnPage() {
  return (
    <>
      <section className="section pt-0" style={{ paddingTop: 8 }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <p className="eyebrow">Learn Ayurveda</p>
          <h1 className="h1" style={{ fontSize: "clamp(30px,4vw,46px)" }}>
            Rooted in the texts, written for today
          </h1>
          <p className="lead" style={{ marginTop: 14 }}>
            Short, honest explainers on the herbs and ideas behind Strengthiva&apos;s formulations —
            classical sourcing, no cure claims.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {ENTRIES.map((e) => (
            <article key={e.title} className="log-row" style={{ gridTemplateColumns: "140px 1fr" }}>
              <span className="meta">{e.kind}</span>
              <div>
                <h3>{e.title}</h3>
                <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 14.5, maxWidth: "70ch" }}>
                  {e.body}
                </p>
                {e.link && (
                  <LocalizedClientLink
                    href={e.link.href}
                    className="btn btn-ghost btn-arrow"
                    style={{ marginTop: 8, paddingInline: 0 }}
                  >
                    {e.link.label}
                  </LocalizedClientLink>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <CtaBand title="Ready to shop, or want a reading first?" fontSize="clamp(24px,3.2vw,34px)" />
    </>
  )
}
