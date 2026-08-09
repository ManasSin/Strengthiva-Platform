import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"

import { cn } from "@/lib/utils"

// Badge / chip / flag. New in the 2026-08 rebrand — the references lean on this
// shape constantly (the hero's "Constitution / Digestion / Sleep" chips, the
// plan's condition tags, the lab-report LOW / IN RANGE / WATCH flags) and it was
// being open-coded with a different span-with-classes at each site.
//
// `accent` is one of the deliberate accent moments brand-spec.md rule 1 asks
// for: a sage *border* against a plain surface, rather than a sage fill, so it
// reads as a highlight without competing with the page's one filled CTA.
const badgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border transition-colors [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "border-border bg-surface text-[0.8125rem] font-medium text-neutral",
        accent:
          "border-accent bg-accent/15 text-[0.8125rem] font-medium text-neutral",
        outline:
          "border-border bg-background text-[0.8125rem] font-medium text-foreground",
        // Mono status flags — the lab-report row markers. Uppercase + tracked,
        // per the DM Mono label style.
        flag: "border-transparent bg-surface-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.05em] text-neutral",
        "flag-low": "border-transparent bg-[#f6e9e3] font-mono text-[0.6875rem] font-medium uppercase tracking-[0.05em] text-destructive",
        "flag-watch": "border-transparent bg-[#f4efe1] font-mono text-[0.6875rem] font-medium uppercase tracking-[0.05em] text-[#7a6a3d]",
        // For the dark forest bands.
        onforest: "border-white/20 bg-white/10 text-[0.8125rem] font-medium text-white",
      },
      size: {
        default: "px-3 py-1",
        sm: "px-2.5 py-0.5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
