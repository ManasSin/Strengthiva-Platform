import { Check } from "lucide-react";

// Card-style radio/checkbox option. Restyled for the 2026-08 rebrand against
// docs/redesign/assessment page.png's `.option-card`.
//
// Selection is shown three ways at once — a green edge, a sage-tinted fill, and
// a filled tick — because colour alone is not a sufficient state indicator, and
// on a checkbox group the tick is the only thing that says "several of these can
// be on". The inset ring, rather than a 2px border, is what stops the card
// shifting by a pixel when it's picked.
export function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3.5 rounded-md border px-4 py-3.5 text-left text-[0.9375rem] transition-[background-color,border-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        selected
          ? "border-primary bg-surface font-medium text-foreground shadow-[inset_0_0_0_1px_var(--brand-primary)]"
          : "border-border bg-background text-foreground hover:border-primary hover:bg-surface"
      }`}
    >
      <span className="min-w-0 flex-1">{label}</span>
      <span
        aria-hidden
        className={`grid size-[1.375rem] shrink-0 place-items-center rounded-full border-[1.5px] ${
          selected ? "border-primary bg-primary" : "border-border"
        }`}
      >
        <Check
          className={`size-3.5 text-white ${selected ? "opacity-100" : "opacity-0"}`}
          strokeWidth={2.2}
        />
      </span>
    </button>
  );
}
