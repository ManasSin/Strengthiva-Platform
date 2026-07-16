import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Strengthiva — Modern Ayurvedic Wisdom",
  description:
    "Personalized Ayurvedic wellness — AI-driven health assessments, diet plans, and product recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", fraunces.variable, inter.variable)}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
