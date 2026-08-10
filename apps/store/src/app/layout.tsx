import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { DM_Mono, DM_Sans, Newsreader } from "next/font/google"
import "styles/globals.css"

// Same three brand faces as app.strengthiva.com (docs/redesign/brand-spec.md
// § Font Stacks) — the two origins have to read as one brand, so this list and
// the app's src/app/layout.tsx are kept identical.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
})
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})
// Not a variable font — only the weights DM Mono actually ships.
const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
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
      className={`${newsreader.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}
    >
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
