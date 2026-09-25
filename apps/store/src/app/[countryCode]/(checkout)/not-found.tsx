import InteractiveLink from "@modules/common/components/interactive-link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "404",
  description: "Something went wrong",
}

export default async function NotFound() {
  return (
    <section className="section">
      <div className="container center" style={{ textAlign: "center" }}>
        <h1 className="h2">Page not found</h1>
        <p className="lead" style={{ margin: "12px auto 0" }}>
          The page you tried to access does not exist.
        </p>
        <div style={{ marginTop: 16 }}>
          <InteractiveLink href="/">Go to frontpage</InteractiveLink>
        </div>
      </div>
    </section>
  )
}
