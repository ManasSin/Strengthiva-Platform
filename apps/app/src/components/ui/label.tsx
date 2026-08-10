"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 font-body text-[0.9375rem] leading-none font-medium text-foreground select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

/**
 * The mono/uppercase label from brand-spec.md's font stack — the small key that
 * sits above a value ("YOUR CONSTITUTION", "MORNING", "STEP 2 OF 5"). Rendered
 * in the brand green by default; on a dark band, wrap the region in `on-forest`
 * and the `.eyebrow` rule in globals.css switches it to sage.
 */
function Eyebrow({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="eyebrow" className={cn("eyebrow", className)} {...props} />
}

export { Label, Eyebrow }
