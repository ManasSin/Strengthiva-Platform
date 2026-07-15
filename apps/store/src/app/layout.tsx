import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Manrope, Plus_Jakarta_Sans } from "next/font/google"
import "styles/globals.css"

// Same brand fonts as app.strengthiva.com — see docs/platform-architecture/
// tech-specs/store-frontend/integration-notes.md's "Design tokens" section.
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] })
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Strengthiva Store",
  description: "Ayurvedic supplements and wellness products, recommended for you.",
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="light"
      className={`${manrope.variable} ${plusJakartaSans.variable}`}
    >
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
