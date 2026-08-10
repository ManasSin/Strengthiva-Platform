import { cn } from "@/lib/utils";

/**
 * The decorative line sprig from docs/redesign/new design style 1.html.
 *
 * The only bespoke illustration in the system — everything else uses lucide
 * (already a dependency, and "Linear" is the icon treatment the Nexura guide
 * calls for). Drawn in `currentColor` so a parent can tint it: sage at low
 * opacity on light sections, brand green on the forest bands.
 *
 * Purely ornamental: `aria-hidden`, and it must never be the only thing
 * carrying meaning in a section.
 */
export function Botanical({
  className,
  leaves = 7,
}: {
  className?: string;
  leaves?: number;
}) {
  return (
    <svg
      className={cn("pointer-events-none absolute", className)}
      width="220"
      height="300"
      viewBox="0 0 220 300"
      fill="none"
      aria-hidden="true"
    >
      <path d="M110 300V60" stroke="currentColor" strokeWidth="1.5" />
      {Array.from({ length: leaves }, (_, i) => {
        const y = 80 + i * 28;
        return (
          <g key={i} stroke="currentColor" strokeWidth="1.3" fill="none">
            <path d={`M110 ${y} C ${90 - i * 4} ${y - 14}, ${70 - i * 3} ${y - 6}, ${58 - i * 4} ${y + 8}`} />
            <path d={`M110 ${y} C ${130 + i * 4} ${y - 14}, ${150 + i * 3} ${y - 6}, ${162 + i * 4} ${y + 8}`} />
          </g>
        );
      })}
      <circle cx="110" cy="56" r="6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/** The sprout mark that sits beside the wordmark in the nav and footer. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={cn("shrink-0", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20v-8" />
      <path d="M12 12c0-3-2-5-6-5 0 4 2 5 6 5Z" />
      <path d="M12 13c0-3 2-4 5-4 0 3-2 4-5 4Z" />
    </svg>
  );
}
