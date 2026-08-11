"use client";

import { useState } from "react";
import type { Answers } from "@/lib/questionnaire-types";

// Matches the height, radius, border and focus treatment of FieldRenderer's
// `controlClass`. These three inputs sat at 38px on a form where every other
// control is 44px, so the BMI row read as a lesser, denser thing wedged into
// the middle of the questions — and 38px is under the touch-target minimum.
// `pr-8` leaves room for the absolutely-positioned unit suffix.
const numberInputClass =
  "h-11 w-full rounded-sm border border-input bg-background pl-3.5 pr-8 text-[0.9375rem] text-foreground transition-colors outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-accent/45";

// Height/Weight/BMI composite.
//
// Height is ENTERED as feet + inches (what Indian patients actually know their height
// in) but STORED as "height-cm", unchanged. Centimetres remain the single canonical
// unit end to end — the BMI maths here, the prescription-OCR prefill
// (assessment/questionnaire/page.tsx), the wizard's own validity check, and
// profile_builder.extract_bmi_range on the backend all keep reading "height-cm", so
// this is purely an input-affordance change with no contract change behind it.
//
// The BMI label below is DISPLAY-only, on an 8-category scale. It is deliberately NOT
// the value used to pick a diet chart: the backend recomputes a 4-band value
// (16-18.5 / 18.5-25 / 25-35 / >35 — the bands the diet documents are authored in) in
// app/services/bmi_bands.py from the same height/weight submitted here. Two scales on
// purpose: this one is granular enough to be meaningful feedback to a patient, the
// backend's matches the corpus.

const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

function cmToFeetInches(cm: number): { feet: string; inches: string } {
  if (!Number.isFinite(cm) || cm <= 0) return { feet: "", inches: "" };
  const totalInches = Math.round(cm / CM_PER_INCH);
  return {
    feet: String(Math.floor(totalInches / INCHES_PER_FOOT)),
    inches: String(totalInches % INCHES_PER_FOOT),
  };
}

function feetInchesToCm(feet: string, inches: string): string {
  const ft = parseFloat(feet);
  const inch = parseFloat(inches);
  // Inches alone is not a height; feet alone is (5 ft == 5'0"). Treat a blank inches
  // as zero rather than refusing to compute, or the field stays invalid until the
  // user types a 0 they shouldn't have to.
  if (!Number.isFinite(ft)) return "";
  const totalInches = ft * INCHES_PER_FOOT + (Number.isFinite(inch) ? inch : 0);
  if (totalInches <= 0) return "";
  // One decimal keeps the ft/in → cm → ft/in round trip stable without pretending to
  // a precision the input doesn't have.
  return (totalInches * CM_PER_INCH).toFixed(1);
}

export function BmiField({
  answers,
  onChange,
}: {
  answers: Answers;
  onChange: (id: string, value: string) => void;
}) {
  const storedCm = (answers["height-cm"] as string) || "";

  // Feet/inches are local UI state, not answers: the stored value is centimetres, and
  // deriving the two boxes from it on every render would fight the user mid-typing
  // (clearing "5" the moment it round-trips to 152.4 and back). Seeded from the stored
  // value so a prescription-OCR prefill shows up correctly.
  const [feet, setFeet] = useState(() => cmToFeetInches(parseFloat(storedCm)).feet);
  const [inches, setInches] = useState(() => cmToFeetInches(parseFloat(storedCm)).inches);

  // Resync when the stored height changes to something these two boxes don't already
  // represent — i.e. an external write (OCR prefill, restored draft), never the user's
  // own keystrokes echoing back. Adjusting state during render rather than in an effect
  // is React's documented pattern for exactly this ("You Might Not Need an Effect"):
  // it re-renders before the browser paints, so the stale value is never visible, and
  // it avoids the cascading render an effect would cause.
  const [syncedCm, setSyncedCm] = useState(storedCm);
  if (storedCm !== syncedCm) {
    setSyncedCm(storedCm);
    if (feetInchesToCm(feet, inches) !== storedCm) {
      const next = cmToFeetInches(parseFloat(storedCm));
      setFeet(next.feet);
      setInches(next.inches);
    }
  }

  function updateHeight(nextFeet: string, nextInches: string) {
    setFeet(nextFeet);
    setInches(nextInches);
    onChange("height-cm", feetInchesToCm(nextFeet, nextInches));
  }

  const heightCm = parseFloat(storedCm);
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
    // Same question weight as FieldRenderer, and no outer margin — the gap to
    // the next question is owned by the wizard's `space-y-10` stack.
    <div data-slot="bmi-field">
      <label className="mb-1.5 block text-base font-semibold leading-snug text-foreground">
        Height, Weight &amp; BMI
        <span className="ml-1 font-normal text-destructive" aria-hidden>
          *
        </span>
      </label>
      {/* Each column is a self-contained label+control block, and `items-start`
          aligns them by their tops — which is what keeps the three sub-labels on
          one line. It was `items-end` on a single row before, so the columns
          were bottom-aligned and the "162.6 cm" readout under the height inputs
          made that column taller, pushing "Weight (kg)" visibly below "Height".

          Stacks to one column below `sm`: at 375px the three-up grid squeezed
          the ft/in fields to 46px wide, which is not a usable number input. */}
      <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start sm:gap-y-0">
        <div>
          <span className="mb-1 block text-xs text-muted-foreground">Height</span>
          <div className="flex items-start gap-2">
            {[
              { unit: "ft", label: "Height in feet", ph: "5", min: 1, max: 8, value: feet,
                set: (v: string) => updateHeight(v, inches) },
              { unit: "in", label: "Height in inches", ph: "4", min: 0, max: 11, value: inches,
                set: (v: string) => updateHeight(feet, v) },
            ].map((f) => (
              <div key={f.unit} className="relative flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={f.ph}
                  min={f.min}
                  max={f.max}
                  aria-label={f.label}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className={numberInputClass}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {f.unit}
                </span>
              </div>
            ))}
          </div>
          {heightCm > 0 && (
            <div className="mt-1 text-[10px] text-muted-foreground">{heightCm} cm</div>
          )}
        </div>

        <div>
          <span className="mb-1 block text-xs text-muted-foreground">Weight (kg)</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 68"
            aria-label="Weight in kilograms"
            min={10}
            max={300}
            value={(answers["weight-kg"] as string) || ""}
            onChange={(e) => onChange("weight-kg", e.target.value)}
            className={numberInputClass}
          />
        </div>

        {bmi !== null && (
          <div>
            {/* A real third sub-label rather than a spacer: it keeps the badge
                on the same baseline as the other two columns AND says what the
                number is, which nothing did before. */}
            <span className="mb-1 block text-xs text-muted-foreground">BMI</span>
            {/* Polite live region — it recalculates as height/weight are typed,
                and it is the one derived value on the form a screen-reader user
                would otherwise never hear. */}
            <div
              aria-live="polite"
              className="flex h-11 min-w-[4.5rem] flex-col items-center justify-center rounded-lg bg-primary/10 px-3"
            >
              <span className="font-display text-lg leading-none text-primary">
                {bmi.toFixed(1)}
              </span>
              <span className="mt-0.5 text-[10px] leading-none text-muted-foreground">
                {category}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
