"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { adaptQuestionnaireSchema, buildSteps } from "@/lib/questionnaire-schema";
import type { Answers, FieldDef, StepDef } from "@/lib/questionnaire-types";
import { api, ApiError } from "@/lib/api-client";
import { FieldRenderer } from "./field-renderer";
import { BmiField } from "./bmi-field";
import { PhoneVerification } from "./phone-verification";
import { Button } from "@/components/ui/button";

// Mobile number and email are owned by PhoneVerification, which verifies them and
// ties them to the account. Questionnaire questions asking for the same thing get
// hidden rather than rendered alongside it: two mobile fields on one form is
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

function isAnswered(value: Answers[string] | undefined): boolean {
  return Array.isArray(value) ? value.length > 0 : !!value;
}

/**
 * The whole assessment on one page.
 *
 * Sections are NOT hand-authored: each is one entry from buildSteps(), the same
 * DB-backed step list the paginated version used, so an admin adding a step in
 * /admin/questionnaire still gets a section here with no code change — and the
 * conditional disease-condition steps still appear and disappear inline as
 * conditions are ticked (the step count was never fixed; it grows with the
 * conditions selected).
 *
 * Mobile verification gates the entire form rather than sitting next to the name
 * field: the assessment is submitted to an authenticated endpoint, so on a single
 * page the alternative is letting someone fill in every answer and only then
 * discovering they must verify. Verifying first costs one screen up front instead
 * of the whole form's work at the end.
 */
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
  const [allSteps, setAllSteps] = useState<StepDef[] | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [identityVerified, setIdentityVerified] = useState(false);
  // Set only once the user has tried to submit — required-but-empty questions stay
  // unmarked until then, so a form the user has not yet worked through doesn't open
  // covered in red.
  const [showErrors, setShowErrors] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Stable identity so PhoneVerification's reporting effect doesn't re-fire on
  // every render.
  const handleVerifiedChange = useCallback((value: boolean) => setIdentityVerified(value), []);

  useEffect(() => {
    api
      .getQuestionnaireSchema()
      .then((schema) => {
        const adapted = adaptQuestionnaireSchema(schema);
        if (adapted.length === 0) {
          // A 200 response with zero steps is not "still loading" — without this it
          // rendered a loading spinner forever, indistinguishable from a slow network.
          // Confirmed live: an unseeded production questionnaire table produced exactly
          // that — a silent infinite spin with no error at all, worse than a visible one.
          setSchemaError("The assessment isn't available right now. Please try again shortly.");
          return;
        }
        setAllSteps(adapted);
      })
      .catch((err) =>
        setSchemaError(err instanceof ApiError ? err.message : "Failed to load the assessment."),
      );
  }, []);

  // Recomputed on every answer change — this is what makes sections appear and
  // disappear as chronic conditions are ticked.
  const steps = useMemo(() => (allSteps ? buildSteps(answers, allSteps) : []), [answers, allSteps]);

  const visibleFieldsFor = useCallback(
    (s: StepDef): FieldDef[] =>
      s.fields.filter((f) => (!f.visibleIf || f.visibleIf(answers)) && !isIdentityField(f.id)),
    [answers],
  );

  function handleFieldChange(id: string, value: string | string[]) {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      // Selecting a checkbox-group option marked exclusiveValue (e.g. "None") clears
      // every other selection, and vice versa. Only chronic[] has this set today.
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

  // Per-section completeness, used for the progress bar, the "incomplete" markers,
  // and to scroll to the first offending section on a failed submit.
  const sectionState = useMemo(
    () =>
      steps.map((s) => {
        const fields = visibleFieldsFor(s);
        const required = fields.filter((f) => f.required);
        const missing = required.filter((f) => !isAnswered(answers[f.id]));
        const bmiIncomplete = !!s.bmiInsertBeforeFieldKey && !bmiValid;
        return {
          step: s,
          fields,
          missingCount: missing.length + (bmiIncomplete ? 1 : 0),
          requiredCount: required.length + (s.bmiInsertBeforeFieldKey ? 1 : 0),
        };
      }),
    [steps, answers, visibleFieldsFor, bmiValid],
  );

  const totalRequired = sectionState.reduce((n, s) => n + s.requiredCount, 0);
  const totalMissing = sectionState.reduce((n, s) => n + s.missingCount, 0);
  const progressPct =
    totalRequired === 0 ? 0 : Math.round(((totalRequired - totalMissing) / totalRequired) * 100);
  const isComplete = totalMissing === 0 && steps.length > 0;

  function handleSubmit() {
    if (!isComplete) {
      setShowErrors(true);
      const firstIncomplete = sectionState.find((s) => s.missingCount > 0);
      if (firstIncomplete) {
        const el = sectionRefs.current[firstIncomplete.step.id];
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
      return;
    }
    onComplete(answers);
  }

  if (schemaError) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-sm text-red-600">{schemaError}</p>
      </div>
    );
  }

  // Gate: nothing else renders until the mobile number is verified.
  if (!identityVerified) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        {banner}
        <h1 className="mb-2 font-headline text-2xl font-bold text-foreground">
          Verify your mobile number
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          We&apos;ll send you a one-time code. Your assessment and report are saved to this
          number, so you can come back to them any time.
        </p>
        <div className="rounded-2xl border border-border bg-white p-8">
          <PhoneVerification onVerifiedChange={handleVerifiedChange} />
        </div>
      </div>
    );
  }

  if (!allSteps || steps.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl justify-center px-6 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {banner}

      {/* Progress reflects required questions answered, not position on the page —
          on a single page there is no "step 3 of 7" to report. Sticky so it stays
          readable while scrolling a long form. */}
      <div className="sticky top-0 z-10 -mx-6 mb-8 bg-background/95 px-6 py-3 backdrop-blur">
        <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Assessment</span>
          <span>{progressPct}% complete</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-y-8">
        {sectionState.map(({ step, fields, missingCount }) => {
          const bmiAnchorFieldKey = step.bmiInsertBeforeFieldKey;
          const bmiAnchorPresent =
            !!bmiAnchorFieldKey && fields.some((f) => f.id === bmiAnchorFieldKey);

          return (
            <section
              key={step.id}
              ref={(el) => {
                sectionRefs.current[step.id] = el;
              }}
              aria-labelledby={`section-${step.id}`}
              className="scroll-mt-24"
            >
              <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-border pb-2">
                <h2
                  id={`section-${step.id}`}
                  className="font-headline text-xl font-bold text-foreground"
                >
                  <span aria-hidden>{step.icon}</span> {step.title}
                </h2>
                {showErrors && missingCount > 0 && (
                  <span className="shrink-0 text-xs font-medium text-red-600">
                    {missingCount} left
                  </span>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-white p-8">
                {fields.map((field, index) => (
                  <div key={field.id}>
                    {/* BMI is a composite (height + weight) not representable as a single
                        FieldDef — inserted right before the section's anchor question
                        (bmiInsertBeforeFieldKey, seeded as "occupation" on basic-info).
                        Falls back to rendering first in the section if that question is
                        missing (e.g. an admin deleted/renamed it), rather than silently
                        dropping BMI from the form entirely. */}
                    {bmiAnchorFieldKey &&
                      (bmiAnchorPresent ? field.id === bmiAnchorFieldKey : index === 0) && (
                        <BmiField answers={answers} onChange={handleFieldChange} />
                      )}
                    <FieldRenderer field={field} answers={answers} onChange={handleFieldChange} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-end gap-2">
        {showErrors && !isComplete && (
          <p className="text-sm text-red-600">
            {totalMissing} required question{totalMissing === 1 ? "" : "s"} still to answer.
          </p>
        )}
        <Button type="button" variant="secondary" size="lg" onClick={handleSubmit}>
          Complete Assessment
        </Button>
      </div>
    </div>
  );
}
