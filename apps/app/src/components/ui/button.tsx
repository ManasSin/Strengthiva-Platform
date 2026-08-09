import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Restated for the 2026-08 rebrand against docs/redesign/new design style 1.html
// (`.btn` and friends). Four looks exist in the references and no more:
//
//   default   — sage-filled pill. THE call to action. brand-spec.md rule 1
//               reserves the accent for "single high-value CTAs per viewport",
//               so at most one of these should be visible at a time.
//   secondary — white with a hairline border. The companion action that sits
//               beside a `default` ("See a sample plan", "Use a sample report").
//   outline / ghost — quieter still; same geometry, less fill.
//   onforest  — white pill for the dark forest bands, where both the sage and
//               the hairline lose their contrast.
//
// ── Alignment ───────────────────────────────────────────────────────────────
// Sizes set `min-h-*` + symmetric padding, never a fixed `h-*`. The old fixed
// heights were the root of the CTA misalignment: any call site that added its
// own `py-*`/`text-*` (report/[id]/page.tsx's "Add to Cart" did exactly this)
// ended up with padding fighting a locked height, so the label sat off-centre
// and the control no longer matched the button next to it. With a min-height
// the box grows to fit instead, and `inline-flex items-center justify-center`
// keeps the label and any icon centred on both axes at every size.
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-full border border-transparent bg-clip-padding",
    "font-body font-semibold whitespace-nowrap",
    "transition-[background-color,border-color,box-shadow,transform] duration-200",
    "outline-none select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-45",
    "aria-invalid:border-destructive",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.0625rem]",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-foreground shadow-hairline hover:bg-sage-hover",
        secondary:
          "border-border bg-background text-foreground hover:border-foreground/25 hover:bg-surface",
        outline:
          "border-border bg-transparent text-foreground hover:bg-surface",
        ghost:
          "text-foreground hover:bg-surface",
        onforest:
          "bg-white text-forest hover:bg-surface-2",
        destructive:
          "border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/15",
        // Quiet text action — the reference HTML's `.link-quiet`. Square-ish so
        // the accent underline reads as an underline, not a pill edge.
        link: "rounded-none border-0 border-b-[1.5px] border-b-accent px-0 py-0 text-foreground hover:border-b-primary",
      },
      size: {
        default: "min-h-12 px-[1.375rem] py-3.5 text-[0.9375rem]",
        sm: "min-h-10 px-4 py-2.5 text-sm",
        xs: "min-h-8 gap-1.5 px-3 py-1.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "min-h-[3.25rem] px-7 py-4 text-base",
        icon: "size-11 min-h-0 p-0",
        "icon-sm": "size-9 min-h-0 p-0",
        "icon-xs": "size-7 min-h-0 p-0 [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    compoundVariants: [
      // `link` opts out of the size padding entirely — it's text, not a control.
      { variant: "link", size: "default", className: "min-h-0 px-0 py-0" },
      { variant: "link", size: "sm", className: "min-h-0 px-0 py-0" },
      { variant: "link", size: "lg", className: "min-h-0 px-0 py-0" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
