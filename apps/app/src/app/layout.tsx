import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// The 2026-08 rebrand's three faces (docs/redesign/brand-spec.md § Font Stacks).
//
// Loaded through next/font rather than the reference HTML's <link> to
// fonts.googleapis.com: next/font fetches the files at build time and self-hosts
// them from our own origin, so visitors make no third-party request and get no
// swap-in layout shift. The build itself still needs egress to Google — that was
// already true of the Fraunces/Inter pair this replaces, so the Docker build's
// network requirements are unchanged.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  // 400 is the display weight the whole system is built on (brand-spec rule 3:
  // "delicate Newsreader display headings"). 500/600 are for the rare heavier
  // label; nothing here should reach for 700.
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// DM Mono carries the eyebrow/label style — uppercase, wide tracking. Not a
// variable font, so the weights it actually ships (300/400/500) are listed
// explicitly; asking for 600 here fails the build.
const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Strengthiva — Ayurveda that starts with you",
  description:
    "Take the assessment, get your Ayurvedic reading and a daily diet plan built around it — before anyone sells you anything.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        newsreader.variable,
        dmSans.variable,
        dmMono.variable,
      )}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
