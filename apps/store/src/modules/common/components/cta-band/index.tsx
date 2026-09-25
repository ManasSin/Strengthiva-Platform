import LocalizedClientLink from "@modules/common/components/localized-client-link"

/*
  The dark closing band every handoff page ends on (.cta-band, the one
  --green-deep surface per page). "Take the assessment" goes to the store's
  /personalized explainer, as in the prototype; that page is the one that
  links out to app.strengthiva.com.
*/
export default function CtaBand({
  title,
  lead,
  fontSize = "clamp(24px,3.2vw,36px)",
}: {
  title: string
  lead?: string
  fontSize?: string
}) {
  return (
    <section className="section">
      <div className="container">
        <div className="cta-band center">
          <h2 style={{ fontSize }}>{title}</h2>
          {lead ? (
            <p className="lead center" style={{ margin: "14px auto 26px" }}>
              {lead}
            </p>
          ) : (
            <div style={{ height: 22 }} />
          )}
          <div className="row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
            <LocalizedClientLink href="/store" className="btn btn-primary">
              Shop all products
            </LocalizedClientLink>
            <LocalizedClientLink href="/personalized" className="btn btn-secondary btn-on-dark">
              Take the assessment
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}
