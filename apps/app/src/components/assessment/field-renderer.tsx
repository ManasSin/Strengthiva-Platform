import type { Answers, FieldDef } from "@/lib/questionnaire-types";
import { OptionCard } from "./option-card";

// Dispatches a single FieldDef to the right input UI and updates `answers` via
// `onChange`. One renderer for all 87 fields in questionnaire-schema.ts, since
// hand-authoring a component per field isn't warranted — they're all one of a
// handful of shapes (radio/checkbox-group/text/select/slider/textarea).
//
// Restyled for the 2026-08 rebrand. The text/number/textarea/select inputs share
// one class string (`controlClass`) rather than four near-identical copies that
// had already drifted apart — the select had a different focus treatment from
// the inputs beside it.
const controlClass =
  "w-full rounded-sm border border-input bg-background px-3.5 py-2.5 text-[0.9375rem] text-foreground transition-colors outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-accent/45";

export function FieldRenderer({
  field,
  answers,
  onChange,
}: {
  field: FieldDef;
  answers: Answers;
  onChange: (id: string, value: string | string[]) => void;
}) {
  const value = answers[field.id];
  // Options are full-width rows now (as in the reference), so the multi-column
  // packing only kicks in from `sm:` up — on a phone a 3-up grid of option cards
  // gave each one about 90px and truncated every label.
  const gridCols = field.columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  const fieldId = `field-${field.id}`;
  const describedBy = field.sublabel ? `${fieldId}-hint` : undefined;

  return (
    // No outer margin on purpose — the gap BETWEEN questions belongs to the
    // container (wizard.tsx renders these into a `space-y-10` stack).
    //
    // This used to be `mb-10 last:mb-0`, which silently produced zero gap on
    // every question: the wizard wraps each field in its own <div> so the BMI
    // composite can be injected before its anchor, which made every
    // FieldRenderer root the ONLY child of its wrapper — so `last:` matched all
    // of them, not just the final one. A child owning its own outside spacing
    // through a positional variant is only correct if you also control how the
    // parent wraps it; the container owning it can't be defeated that way.
    //
    // Inside a question the rhythm is:
    //   label -> its control   6px (mb-1.5, plus leading-snug so the label's
    //                          own line-height leading doesn't pad it further)
    //   option -> option       8px (gap-2 on the grids below)
    // against 40px between questions — a 5x step at the boundary, which is what
    // makes each question read as one group rather than the whole section
    // reading as an undifferentiated stack of pills.
    <div>
      <label
        htmlFor={fieldId}
        className="mb-1.5 block text-base font-semibold leading-snug text-foreground"
      >
        {field.label}
        {field.required && (
          <span className="ml-1 font-normal text-destructive" aria-hidden>
            *
          </span>
        )}
        {field.required && <span className="sr-only"> (required)</span>}
      </label>
      {field.sublabel && (
        <p
          id={describedBy}
          className="mb-2 -mt-0.5 text-[0.84375rem] leading-snug text-muted-foreground"
        >
          {field.sublabel}
        </p>
      )}

      {field.type === "text" && (
        <input
          id={fieldId}
          type="text"
          value={(value as string) || ""}
          placeholder={field.placeholder}
          aria-describedby={describedBy}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={controlClass}
        />
      )}

      {field.type === "number" && (
        <input
          id={fieldId}
          type="number"
          value={(value as string) || ""}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          aria-describedby={describedBy}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={controlClass}
        />
      )}

      {field.type === "textarea" && (
        <textarea
          id={fieldId}
          value={(value as string) || ""}
          placeholder={field.placeholder}
          rows={3}
          aria-describedby={describedBy}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={controlClass}
        />
      )}

      {field.type === "select" && (
        <select
          id={fieldId}
          value={(value as string) || ""}
          aria-describedby={describedBy}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={controlClass}
        >
          <option value="">Select…</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {field.type === "radio" && (
        <div className={`grid grid-cols-1 gap-2 ${gridCols}`} role="group" aria-labelledby={fieldId}>
          {field.options?.map((opt) => (
            <OptionCard
              key={opt.value}
              label={opt.label}
              selected={value === opt.value}
              onClick={() => onChange(field.id, opt.value)}
            />
          ))}
        </div>
      )}

      {field.type === "checkbox-group" && (
        <div className={`grid grid-cols-1 gap-2 ${gridCols}`} role="group" aria-labelledby={fieldId}>
          {field.options?.map((opt) => {
            const current = (value as string[] | undefined) ?? [];
            const isSelected = current.includes(opt.value);
            return (
              <OptionCard
                key={opt.value}
                label={opt.label}
                selected={isSelected}
                onClick={() => {
                  const next = isSelected
                    ? current.filter((v) => v !== opt.value)
                    : [...current, opt.value];
                  onChange(field.id, next);
                }}
              />
            );
          })}
        </div>
      )}

      {field.type === "slider" && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Very low</span>
            <span>Very good</span>
          </div>
          <input
            id={fieldId}
            type="range"
            min={field.min}
            max={field.max}
            value={(value as string) || "5"}
            aria-describedby={describedBy}
            onChange={(e) => onChange(field.id, e.target.value)}
            className="mt-1.5 w-full accent-primary"
          />
          <div className="mt-1.5 text-center font-mono text-sm text-primary">
            {(value as string) || "5"} / {field.max}
          </div>
        </div>
      )}
    </div>
  );
}
