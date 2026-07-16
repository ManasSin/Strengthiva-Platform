import type { Answers, FieldDef } from "@/lib/questionnaire-types";
import { OptionCard } from "./option-card";

// Dispatches a single FieldDef to the right input UI and updates `answers` via
// `onChange`. One renderer for all 87 fields in questionnaire-schema.ts, since
// hand-authoring a component per field isn't warranted — they're all one of a
// handful of shapes (radio/checkbox-group/text/select/slider/textarea).
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
  const gridCols = field.columns === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="mb-8">
      <label className="mb-2 block text-base font-medium text-foreground">
        {field.label}
        {field.required && <span className="ml-1 text-secondary">*</span>}
      </label>
      {field.sublabel && <p className="mb-2.5 text-sm text-muted-foreground">{field.sublabel}</p>}

      {field.type === "text" && (
        <input
          type="text"
          value={(value as string) || ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.id, e.target.value)}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-base focus:border-primary focus:outline-none"
        />
      )}

      {field.type === "number" && (
        <input
          type="number"
          value={(value as string) || ""}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          onChange={(e) => onChange(field.id, e.target.value)}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-base focus:border-primary focus:outline-none"
        />
      )}

      {field.type === "textarea" && (
        <textarea
          value={(value as string) || ""}
          placeholder={field.placeholder}
          rows={3}
          onChange={(e) => onChange(field.id, e.target.value)}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-base focus:border-primary focus:outline-none"
        />
      )}

      {field.type === "select" && (
        <select
          value={(value as string) || ""}
          onChange={(e) => onChange(field.id, e.target.value)}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-base focus:border-primary focus:outline-none"
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
        <div className={`grid ${gridCols} gap-2`}>
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
        <div className={`grid ${gridCols} gap-2`}>
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
            <span>😞 Very low</span>
            <span>😁 Very good</span>
          </div>
          <input
            type="range"
            min={field.min}
            max={field.max}
            value={(value as string) || "5"}
            onChange={(e) => onChange(field.id, e.target.value)}
            className="mt-1 w-full accent-primary"
          />
          <div className="mt-1 text-center text-sm font-medium text-primary">
            {(value as string) || "5"} / {field.max}
          </div>
        </div>
      )}
    </div>
  );
}
