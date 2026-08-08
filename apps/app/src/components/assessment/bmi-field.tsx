"use client";

import { useState } from "react";
import type { Answers } from "@/lib/questionnaire-types";

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
    <div className="mb-6">
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        Height, Weight &amp; BMI<span className="ml-1 text-secondary">*</span>
      </label>
      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Height</label>
          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                inputMode="numeric"
                placeholder="5"
                min={1}
                max={8}
                aria-label="Height in feet"
                value={feet}
                onChange={(e) => updateHeight(e.target.value, inches)}
                className="w-full rounded-lg border border-border py-2 pl-3 pr-8 text-sm focus:border-primary focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                ft
              </span>
            </div>
            <div className="relative flex-1">
              <input
                type="number"
                inputMode="numeric"
                placeholder="4"
                min={0}
                max={11}
                aria-label="Height in inches"
                value={inches}
                onChange={(e) => updateHeight(feet, e.target.value)}
                className="w-full rounded-lg border border-border py-2 pl-3 pr-8 text-sm focus:border-primary focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                in
              </span>
            </div>
          </div>
          {heightCm > 0 && (
            <div className="mt-1 text-[10px] text-muted-foreground">{heightCm} cm</div>
          )}
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
