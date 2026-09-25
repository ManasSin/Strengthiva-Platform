import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

const Help = () => {
  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ marginBottom: 8 }}>Need help?</h3>
      <div className="row" style={{ gap: 16 }}>
        <LocalizedClientLink href="/contact" className="meta">
          Contact
        </LocalizedClientLink>
        <LocalizedClientLink href="/contact" className="meta">
          Returns &amp; Exchanges
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default Help
