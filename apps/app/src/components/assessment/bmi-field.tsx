import type { Answers } from "@/lib/questionnaire-types";

// Height/Weight/BMI composite — matches test-ui.html's calcBMI() 8-category
// display scale exactly (this is a DISPLAY-only label; the 4-bucket
// Underweight/Normal/Overweight/Obese filter used by the backend is computed
// server-side in app/services/profile_builder.py::extract_bmi_range, from the
// same height-cm/weight-kg values submitted here).
export function BmiField({
  answers,
  onChange,
}: {
  answers: Answers;
  onChange: (id: string, value: string) => void;
}) {
  const heightCm = parseFloat((answers["height-cm"] as string) || "");
  const weightKg = parseFloat((answers["weight-kg"] as string) || "");
  const valid = heightCm >= 50 && weightKg >= 10;
  const bmi = valid ? weightKg / (heightCm / 100) ** 2 : null;
  const category =
    bmi === null
      ? null
      : bmi < 16
        ? "Severe Thinness"
        : bmi < 17
          ? "Moderate Thinness"
          : bmi < 18.5
            ? "Mild Thinness"
            : bmi < 25
              ? "Normal"
              : bmi < 30
                ? "Overweight"
                : bmi < 35
                  ? "Obese I"
                  : bmi < 40
                    ? "Obese II"
                    : "Obese III";

  return (
    <div className="mb-6">
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        Height, Weight &amp; BMI<span className="ml-1 text-secondary">*</span>
      </label>
      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Height (cm)</label>
          <input
            type="number"
            placeholder="e.g. 165"
            min={50}
            max={250}
            value={(answers["height-cm"] as string) || ""}
            onChange={(e) => onChange("height-cm", e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Weight (kg)</label>
          <input
            type="number"
            placeholder="e.g. 68"
            min={10}
            max={300}
            value={(answers["weight-kg"] as string) || ""}
            onChange={(e) => onChange("weight-kg", e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        {bmi !== null && (
          <div className="rounded-lg bg-primary/10 px-3 py-2 text-center">
            <div className="text-lg font-bold text-primary">{bmi.toFixed(1)}</div>
            <div className="text-[10px] text-muted-foreground">{category}</div>
          </div>
        )}
      </div>
    </div>
  );
}
