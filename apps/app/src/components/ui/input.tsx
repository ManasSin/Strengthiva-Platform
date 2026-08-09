import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

// Restated for the 2026-08 rebrand: hairline border, sage-soft focus ring, and
// a comfortable 44px target (the stock h-8 was well under the 44px touch
// minimum, and looked undersized beside the new min-h-12 buttons).
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-sm border border-input bg-background px-3.5 py-2 text-base text-foreground transition-colors outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-muted-foreground/70",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-accent/45",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        "md:text-[0.9375rem]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Numeric field with a trailing unit, as used on the lab-report confirmation
 * screen (`ng/mL`, `g/dL`, …). The value is DM Mono so digits align down the
 * column; the unit is muted and sits inside the same bordered box, which is
 * what keeps the rows visually flush in the reference.
 */
function InputWithUnit({
  unit,
  className,
  inputClassName,
  ...props
}: React.ComponentProps<"input"> & { unit: string; inputClassName?: string }) {
  return (
    <div
      className={cn(
        "flex h-11 items-center gap-2 rounded-sm border border-input bg-background px-3.5 transition-colors",
        "focus-within:border-primary focus-within:ring-2 focus-within:ring-accent/45",
        className
      )}
    >
      <input
        data-slot="input"
        className={cn(
          "w-full min-w-0 border-0 bg-transparent font-mono text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground/70",
          inputClassName
        )}
        {...props}
      />
      <span className="shrink-0 font-mono text-xs text-muted-foreground">{unit}</span>
    </div>
  )
}

export { Input, InputWithUnit }
