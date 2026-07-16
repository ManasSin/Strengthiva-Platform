// Card-style radio/checkbox option, matching the Figma assessment pages'
// selectable-card pattern (docs/figma exports/Assessment pages.png).
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
      className={`rounded-xl border-2 px-5 py-3.5 text-left text-base transition-colors ${
        selected
          ? "border-primary bg-primary/5 font-medium text-primary"
          : "border-border bg-white text-foreground hover:border-primary/40"
      }`}
    >
      {label}
    </button>
  );
}
