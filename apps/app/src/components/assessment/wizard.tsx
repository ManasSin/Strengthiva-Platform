"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { adaptQuestionnaireSchema, buildSteps } from "@/lib/questionnaire-schema";
import type { Answers, StepDef } from "@/lib/questionnaire-types";
import { api, ApiError } from "@/lib/api-client";
import { FieldRenderer } from "./field-renderer";
import { BmiField } from "./bmi-field";
import { PhoneVerification } from "./phone-verification";
import { Button } from "@/components/ui/button";

// Identity is collected directly under the name field, on whichever step asks for
// it — anchored to the field rather than to a step index so that reordering steps
// in /admin/questionnaire can't strand it. Same approach as the BMI composite
// (bmiInsertBeforeFieldKey), which is anchored to "occupation".
const IDENTITY_ANCHOR_FIELD = "name";

// Mobile number and email are owned by PhoneVerification, which verifies them and
// ties them to the account. Questionnaire questions asking for the same thing get
// hidden rather than rendered alongside it: two mobile fields on one screen is
// confusing, only one of them would be verified, and the answer would be stored
// on the assessment as a second, unverified copy of the contact details already
// on the user record.
//
// Matched on a normalised key so "mobile number", "mobile-no" and "phone" are all
// caught. If a genuinely different contact question is ever needed (an alternate
// number, say), give it a key that doesn't read as the user's own — or drop this
// suppression and delete the duplicate in /admin/questionnaire instead.
const IDENTITY_FIELD_KEYS = new Set([
  "mobile", "mobileno", "mobilenumber", "phone", "phoneno", "phonenumber",
  "contact", "contactno", "contactnumber", "email", "emailid", "emailaddress",
]);

function isIdentityField(fieldKey: string): boolean {
  return IDENTITY_FIELD_KEYS.has(fieldKey.toLowerCase().replace(/[^a-z0-9]/gi, ""));
}

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

  // Fetched once from FastAPI (DB-backed — see questionnaire-schema.ts's
  // module docstring) rather than imported as a static module, but still
  // recomputed into the visible step list client-side on every answer change
  // (no added network round-trip per checkbox) — same responsiveness as the
  // old hardcoded version.
  const [allSteps, setAllSteps] = useState<StepDef[] | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [identityVerified, setIdentityVerified] = useState(false);
  // Stable identity so PhoneVerification's reporting effect doesn't re-fire on
  // every wizard render.
  const handleVerifiedChange = useCallback((value: boolean) => setIdentityVerified(value), []);

  useEffect(() => {
    api
      .getQuestionnaireSchema()
      .then((schema) => setAllSteps(adaptQuestionnaireSchema(schema)))
      .catch((err) => setSchemaError(err instanceof ApiError ? err.message : "Failed to load the assessment."));
  }, []);

  // Recomputed every render — this is what makes the wizard grow/shrink as the
  // user checks/unchecks chronic conditions (modules/app-frontend.md §4: "the
  // wizard's step count is not fixed at 5 — it grows with how many conditions
  // the user selects").
  const steps = useMemo(() => (allSteps ? buildSteps(answers, allSteps) : []), [answers, allSteps]);
  const clampedIndex = Math.min(stepIndex, Math.max(steps.length - 1, 0));
  const step = steps[clampedIndex];

  const visibleFields = step
    ? step.fields.filter((f) => (!f.visibleIf || f.visibleIf(answers)) && !isIdentityField(f.id))
    : [];
  // Only the step containing the BMI composite field has this set (seeded
  // only on basic-info) — generalizes the old `step.id === "basic-info"` check.
  const bmiAnchorFieldKey = step?.bmiInsertBeforeFieldKey;
  const bmiAnchorPresent = !!bmiAnchorFieldKey && visibleFields.some((f) => f.id === bmiAnchorFieldKey);

  function handleFieldChange(id: string, value: string | string[]) {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      // Generalizes the old chronic[]-only "None" mutual-exclusivity special
      // case (ported from test-ui.html:1525-1536): selecting a checkbox-group
      // option marked exclusiveValue clears every other selection, and vice
      // versa. Only chronic[] has this set today (see seed_questionnaire.py).
      const exclusiveValue = allSteps?.flatMap((s) => s.fields).find((f) => f.id === id)?.exclusiveValue;
      if (exclusiveValue && Array.isArray(value)) {
        const prevValue = (prev[id] as string[] | undefined) ?? [];
        if (value.includes(exclusiveValue) && !prevValue.includes(exclusiveValue)) {
          next[id] = [exclusiveValue];
        } else if (value.length > 1 && value.includes(exclusiveValue)) {
          next[id] = value.filter((v) => v !== exclusiveValue);
        }
      }
      return next;
    });
  }

  const bmiValid =
    parseFloat((answers["height-cm"] as string) || "") >= 50 &&
    parseFloat((answers["weight-kg"] as string) || "") >= 10;

  // The step holding the identity anchor can't be left until the mobile number is
  // verified (and, for a fresh OTP sign-up, an email given) — the assessment is
  // submitted to an authenticated endpoint, so collecting the rest of the answers
  // first would only fail at the end with everything already typed in.
  const showsIdentity = visibleFields.some((f) => f.id === IDENTITY_ANCHOR_FIELD);

  const isStepValid = Boolean(step) && visibleFields
    .filter((f) => f.required)
    .every((f) => {
      const v = answers[f.id];
      return Array.isArray(v) ? v.length > 0 : !!v;
    }) && (!bmiAnchorFieldKey || bmiValid) && (!showsIdentity || identityVerified);

  const isLastStep = clampedIndex === steps.length - 1;
  const progressPct = steps.length > 0 ? Math.round(((clampedIndex + 1) / steps.length) * 100) : 0;

  if (schemaError) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-sm text-red-600">{schemaError}</p>
      </div>
    );
  }

  if (!allSteps || !step) {
    return (
      <div className="mx-auto flex max-w-2xl justify-center px-6 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

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
        {visibleFields.map((field, index) => (
          <div key={field.id}>
            {/* BMI is a composite (height-cm + weight-kg) field not representable
                as a single FieldDef — inserted right before the step's anchor
                question (bmiInsertBeforeFieldKey, seeded as "occupation" on
                basic-info). Falls back to rendering first in the step if that
                question is missing (e.g. an admin deleted/renamed it), rather
                than silently dropping BMI from the wizard entirely. */}
            {bmiAnchorFieldKey && (bmiAnchorPresent ? field.id === bmiAnchorFieldKey : index === 0) && (
              <BmiField answers={answers} onChange={(id, v) => handleFieldChange(id, v)} />
            )}
            <FieldRenderer field={field} answers={answers} onChange={handleFieldChange} />
            {/* Directly below the name field, per the flow the client specified:
                name, then verify the mobile, then email. */}
            {field.id === IDENTITY_ANCHOR_FIELD && (
              <PhoneVerification
                name={(answers[IDENTITY_ANCHOR_FIELD] as string | undefined) ?? undefined}
                onVerifiedChange={handleVerifiedChange}
              />
            )}
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
