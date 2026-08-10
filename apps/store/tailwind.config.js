const path = require("path")

module.exports = {
  darkMode: "class",
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      transitionProperty: {
        width: "width margin",
        height: "height",
        bg: "background-color",
        display: "display opacity",
        visibility: "visibility",
        padding: "padding-top padding-right padding-bottom padding-left",
      },
      colors: {
        grey: {
          0: "#FFFFFF",
          5: "#F9FAFB",
          10: "#F3F4F6",
          20: "#E5E7EB",
          30: "#D1D5DB",
          40: "#9CA3AF",
          50: "#6B7280",
          60: "#4B5563",
          70: "#374151",
          80: "#1F2937",
          90: "#111827",
        },
        // Strengthiva brand palette — the 2026-08 rebrand. Values live as RGB
        // channels in src/styles/globals.css (:root) and are wired up here with
        // the <alpha-value> slot so opacity modifiers (bg-surface/60,
        // text-forest/70) actually resolve. See that file's header for why the
        // two apps duplicate rather than share this list.
        bg: "rgb(var(--brand-bg) / <alpha-value>)",
        surface: "rgb(var(--brand-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--brand-surface-2) / <alpha-value>)",
        forest: "rgb(var(--brand-fg) / <alpha-value>)",
        muted: "rgb(var(--brand-muted) / <alpha-value>)",
        hairline: "rgb(var(--brand-hairline) / <alpha-value>)",
        accent: "rgb(var(--brand-sage) / <alpha-value>)",
        "accent-hover": "rgb(var(--brand-sage-hover) / <alpha-value>)",
        "accent-soft": "rgb(var(--brand-sage-soft) / <alpha-value>)",
        primary: "rgb(var(--brand-primary) / <alpha-value>)",
        secondary: "rgb(var(--brand-secondary) / <alpha-value>)",
        tertiary: "rgb(var(--brand-tertiary) / <alpha-value>)",
        brandneutral: "rgb(var(--brand-neutral) / <alpha-value>)",
        danger: "rgb(var(--brand-danger) / <alpha-value>)",
      },
      borderColor: {
        // The hairline system: 1px of the foreground at 12% (brand-spec rule 4).
        DEFAULT: "rgb(var(--brand-hairline) / 0.12)",
        hairline: "rgb(var(--brand-hairline) / 0.12)",
        "hairline-soft": "rgb(var(--brand-hairline) / 0.08)",
      },
      boxShadow: {
        hairline: "var(--brand-shadow-hairline)",
        soft: "var(--brand-shadow-soft)",
        lifted: "var(--brand-shadow-lifted)",
      },
      borderRadius: {
        none: "0px",
        soft: "2px",
        base: "4px",
        rounded: "8px",
        // Matched to the app's radius scale (8 / 14 / 22 / 28 / full) so a card
        // looks the same on both origins.
        md: "14px",
        large: "16px",
        lg: "22px",
        xl: "28px",
        circle: "9999px",
      },
      screens: {
        "2xsmall": "320px",
        xsmall: "512px",
        small: "1024px",
        medium: "1280px",
        large: "1440px",
        xlarge: "1680px",
        "2xlarge": "1920px",
      },
      fontSize: {
        "3xl": "2rem",
        // Display scale, shared with the app. Newsreader at 400 with negative
        // tracking that tightens as the size grows (brand-spec rule 3); the
        // 88px step is the Nexura display-lg slot.
        display: ["5.5rem", { lineHeight: "0.84", letterSpacing: "-0.065em" }],
        "display-sm": ["4.5rem", { lineHeight: "0.92", letterSpacing: "-0.045em" }],
        hero: ["3.5rem", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        title: ["2.5rem", { lineHeight: "1.06", letterSpacing: "-0.022em" }],
        heading: ["1.625rem", { lineHeight: "1.15", letterSpacing: "-0.018em" }],
        subhead: ["1.25rem", { lineHeight: "1.25", letterSpacing: "-0.012em" }],
        // DM Mono label style — uppercase, wide tracking.
        eyebrow: ["0.719rem", { lineHeight: "1.1", letterSpacing: "0.14em" }],
        label: ["0.656rem", { lineHeight: "1.2", letterSpacing: "0.1em" }],
      },
      fontFamily: {
        sans: [
          "var(--font-dm-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Ubuntu",
          "sans-serif",
        ],
        // `headline` kept as an alias of the display face so the existing
        // `font-headline` call sites across the storefront keep resolving
        // through the rebrand instead of silently dropping to sans.
        headline: ["var(--font-newsreader)", "Georgia", "serif"],
        display: ["var(--font-newsreader)", "Georgia", "serif"],
        mono: ["var(--font-dm-mono)", "SFMono-Regular", "Consolas", "monospace"],
      },
      maxWidth: {
        "8xl": "100rem",
        measure: "72.5rem",
      },
      keyframes: {
        ring: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-in-right": {
          "0%": {
            opacity: "0",
            transform: "translateX(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "fade-in-top": {
          "0%": {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-out-top": {
          "0%": {
            height: "100%",
          },
          "99%": {
            height: "0",
          },
          "100%": {
            visibility: "hidden",
          },
        },
        "accordion-slide-up": {
          "0%": {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
          "100%": {
            height: "0",
            opacity: "0",
          },
        },
        "accordion-slide-down": {
          "0%": {
            "min-height": "0",
            "max-height": "0",
            opacity: "0",
          },
          "100%": {
            "min-height": "var(--radix-accordion-content-height)",
            "max-height": "none",
            opacity: "1",
          },
        },
        enter: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        leave: {
          "0%": { transform: "scale(1)", opacity: 1 },
          "100%": { transform: "scale(0.9)", opacity: 0 },
        },
        "slide-in": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        ring: "ring 2.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
        "fade-in-right":
          "fade-in-right 0.3s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-in-top": "fade-in-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-out-top":
          "fade-out-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "accordion-open":
          "accordion-slide-down 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        "accordion-close":
          "accordion-slide-up 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        enter: "enter 200ms ease-out",
        "slide-in": "slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)",
        leave: "leave 150ms ease-in forwards",
      },
    },
  },
  plugins: [require("tailwindcss-radix")()],
}
