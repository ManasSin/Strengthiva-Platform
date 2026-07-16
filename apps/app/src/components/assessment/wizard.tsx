"use client";

import { useMemo, useState, type ReactNode } from "react";
import { buildSteps } from "@/lib/questionnaire-schema";
import type { Answers } from "@/lib/questionnaire-types";
import { FieldRenderer } from "./field-renderer";
import { BmiField } from "./bmi-field";
import { Button } from "@/components/ui/button";

export function AssessmentWizard({
  onComplete,
  initialAnswers,
  banner,
}: {
  onComplete: (answers: Answers) => void;
  initialAnswers?: Answers;
  banner?: ReactNode;
}) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? {});
  const [stepIndex, setStepIndex] = useState(0);

  // Recomputed every render — this is what makes the wizard grow/shrink as the
  // user checks/unchecks chronic conditions (modules/app-frontend.md §4: "the
  // wizard's step count is not fixed at 5 — it grows with how many conditions
  // the user selects").
  const steps = useMemo(() => buildSteps(answers), [answers]);
  const clampedIndex = Math.min(stepIndex, steps.length - 1);
  const step = steps[clampedIndex];

  const visibleFields = step.fields.filter((f) => !f.visibleIf || f.visibleIf(answers));
  const isBasicInfo = step.id === "basic-info";

  function handleFieldChange(id: string, value: string | string[]) {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      // "None" is mutually exclusive with every other chronic condition — ports
      // test-ui.html:1525-1536's exact behavior.
      if (id === "chronic[]" && Array.isArray(value)) {
        if (value.includes("None") && !((prev["chronic[]"] as string[] | undefined) ?? []).includes("None")) {
          next["chronic[]"] = ["None"];
        } else if (value.length > 1 && value.includes("None")) {
          next["chronic[]"] = value.filter((v) => v !== "None");
        }
      }
      return next;
    });
  }

  const bmiValid =
    parseFloat((answers["height-cm"] as string) || "") >= 50 &&
    parseFloat((answers["weight-kg"] as string) || "") >= 10;

  const isStepValid = visibleFields
    .filter((f) => f.required)
    .every((f) => {
      const v = answers[f.id];
      return Array.isArray(v) ? v.length > 0 : !!v;
    }) && (!isBasicInfo || bmiValid);

  const isLastStep = clampedIndex === steps.length - 1;
  const progressPct = Math.round(((clampedIndex + 1) / steps.length) * 100);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {banner}
      <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>
          Step {clampedIndex + 1} of {steps.length}
        </span>
        <span>{progressPct}%</span>
      </div>
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
      </div>

      <h1 className="mb-6 font-headline text-2xl font-bold text-foreground">
        <span aria-hidden>{step.icon}</span> {step.title}
      </h1>

      <div className="rounded-2xl border border-border bg-white p-8">
        {visibleFields.map((field) => (
          <div key={field.id}>
            {/* BMI is a composite (height-cm + weight-kg) field not representable
                as a single FieldDef — inserted right before Occupation, matching
                test-ui.html's document order regardless of whether the
                female-specific fields are showing before it. */}
            {isBasicInfo && field.id === "occupation" && (
              <BmiField answers={answers} onChange={(id, v) => handleFieldChange(id, v)} />
            )}
            <FieldRenderer field={field} answers={answers} onChange={handleFieldChange} />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={clampedIndex === 0}
        >
          ← Back
        </Button>
        <Button
          type="button"
          variant={isLastStep ? "secondary" : "default"}
          size="lg"
          disabled={!isStepValid}
          onClick={() => {
            if (isLastStep) {
              onComplete(answers);
            } else {
              setStepIndex((i) => i + 1);
            }
          }}
        >
          {isLastStep ? "Complete Assessment" : "Next Step →"}
        </Button>
      </div>
    </div>
  );
}
