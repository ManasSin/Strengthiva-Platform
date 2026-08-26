"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, CircleAlert } from "lucide-react";

import { adaptQuestionnaireSchema, buildSteps } from "@/lib/questionnaire-schema";
import type { Answers, FieldDef, StepDef } from "@/lib/questionnaire-types";
import { api, ApiError } from "@/lib/api-client";
import { FieldRenderer } from "./field-renderer";
import { BmiField } from "./bmi-field";
import { PhoneVerification } from "./phone-verification";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
 * The optional self-photo used to live at the foot of this form. It now has its own
 * step after submit (src/app/assessment/photo/page.tsx): report generation is ~10-15s
 * of LLM work, and starting it the moment the answers are in — rather than after the
 * user has finished choosing a photo — is what lets the two overlap. Nothing here
 * depends on the photo; it never reaches the AI layer.
 *
 * Mobile verification gates the entire form rather than sitting next to the name
 * field: the assessment is submitted to an authenticated endpoint, so on a single
 * page the alternative is letting someone fill in every answer and only then
 * discovering they must verify. Verifying first costs one screen up front instead
 * of the whole form's work at the end.
 *
 * ── 2026-08 rebrand ─────────────────────────────────────────────────────────
 * Restyled against docs/redesign/assessment page.png: the sage progress bar, the
 * sticky "YOUR ASSESSMENT" section rail, and the panelled question card all come
 * from there. What did NOT come from there is the *pagination* — that screenshot
 * shows one question per screen with Next/Skip, which is the flow this component
 * deliberately replaced (see the 2026-07 single-page decision). Reinstating it
 * would be a product change wearing a redesign's clothes, so the rail is a
 * section index over one scrolling page rather than a step-by-step pager.
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
  // Which sections have already been checkpointed, so a save fires once per section
  // rather than on every keystroke inside it.
  const savedStepsRef = useRef<Set<string>>(new Set());
  const [resumedFrom, setResumedFrom] = useState<string | null>(null);
  // Answers must not be persisted until the saved draft has been read back, or an empty
  // initial state would overwrite the very progress we are about to restore.
  const draftLoadedRef = useRef(false);

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

  // Restore an in-flight assessment. Runs only once verified, because the draft belongs
  // to the authenticated user and the request would 401 before the OTP gate is passed.
  useEffect(() => {
    if (!identityVerified || draftLoadedRef.current) return;
    let cancelled = false;
    api
      .getAssessmentDraft()
      .then((draft) => {
        if (cancelled) return;
        if (draft && Object.keys(draft.answers ?? {}).length > 0) {
          // Merge under, not over: anything already typed in this session wins over the
          // stored copy, so restoring can never clobber the current tab's work.
          setAnswers((current) => ({ ...draft.answers, ...current }));
          if (draft.last_completed_step) {
            savedStepsRef.current = new Set([draft.last_completed_step]);
            setResumedFrom(draft.last_completed_step);
          }
        }
      })
      .catch(() => {
        // A draft that won't load is not worth blocking on — the user simply starts
        // fresh rather than seeing an error about a feature they never asked for.
      })
      .finally(() => {
        if (!cancelled) draftLoadedRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [identityVerified]);

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

  // Per-section completeness, used for the progress bar, the rail's tick marks,
  // the "incomplete" markers, and to scroll to the first offending section on a
  // failed submit.
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

  // ── Checkpoints ────────────────────────────────────────────────────────────
  // A section becoming complete IS the checkpoint. Saving on that transition rather
  // than on every keystroke means one request per section instead of one per character,
  // and the saved state is always a coherent boundary the user can be returned to.
  //
  // The furthest complete section is the high-water mark: sections can become
  // incomplete again when a chronic condition is ticked and inserts new ones, and
  // progress should not appear to go backwards because the form grew.
  useEffect(() => {
    if (!identityVerified || !draftLoadedRef.current || steps.length === 0) return;

    const newlyComplete = sectionState.filter(
      (s) => s.requiredCount > 0 && s.missingCount === 0 && !savedStepsRef.current.has(s.step.id),
    );
    if (newlyComplete.length === 0) return;

    newlyComplete.forEach((s) => savedStepsRef.current.add(s.step.id));

    // Furthest along in the CURRENT section order — the client is the only party that
    // knows that order, which is why the server stores this value without interpreting it.
    const furthest = [...sectionState]
      .reverse()
      .find((s) => savedStepsRef.current.has(s.step.id));

    api
      .saveAssessmentDraft(answers, furthest?.step.id ?? null)
      .catch(() => {
        // Best-effort. A failed checkpoint must never interrupt someone mid-form; they
        // simply resume from an earlier point if they leave now. Re-armed so the next
        // completed section tries again.
        newlyComplete.forEach((s) => savedStepsRef.current.delete(s.step.id));
      });
  }, [sectionState, answers, identityVerified, steps.length]);

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

  // Every branch below returns bare content — the page shell (nav, sage surface,
  // stepper, measure and padding) is FlowShell's job in
  // src/app/assessment/questionnaire/page.tsx, so nothing here re-declares a
  // container. Two nested `mx-auto max-w-*` wrappers was how the form ended up
  // visually off-centre against the stepper above it.
  if (schemaError) {
    return (
      <div className="py-12">
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} />
          {schemaError}
        </p>
      </div>
    );
  }

  // Gate: nothing else renders until the mobile number is verified.
  if (!identityVerified) {
    return (
      <div className="mx-auto max-w-[36rem]">
        {banner}
        <h1 className="mb-2 text-[clamp(1.5rem,3.4vw,1.875rem)]">Verify your mobile number</h1>
        <p className="mb-6 text-[0.9375rem] leading-relaxed text-muted-foreground">
          We&rsquo;ll send you a one-time code. Your assessment and report are saved to this
          number, so you can come back to them any time.
        </p>
        <div className="rounded-lg border border-border bg-background p-7 shadow-hairline">
          <PhoneVerification onVerifiedChange={handleVerifiedChange} />
        </div>
      </div>
    );
  }

  if (!allSteps || steps.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <div className="size-10 rounded-full border-[3px] border-border border-t-primary motion-safe:animate-spin" />
        <span className="sr-only">Loading the assessment</span>
      </div>
    );
  }

  return (
    <div>
      {banner}

      <div className="grid items-start gap-6 lg:grid-cols-[14.75rem_minmax(0,1fr)]">
        {/* ── Section rail ──────────────────────────────────────────────────
            The reference's "YOUR ASSESSMENT" list. Sticky on desktop; a
            horizontally scrolling strip on narrow screens, where a 236px
            sidebar would eat the whole viewport. */}
        <nav
          aria-label="Assessment sections"
          className="sticky top-[5.5rem] hidden rounded-lg border border-border bg-background p-5 lg:block"
        >
          <Eyebrow className="mb-4 block">Your assessment</Eyebrow>
          <ol className="space-y-0.5">
            {sectionState.map(({ step, missingCount, requiredCount }) => {
              const done = requiredCount > 0 && missingCount === 0;
              return (
                <li key={step.id}>
                  <a
                    href={`#section-${step.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-sm py-2 text-sm transition-colors",
                      done ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-[1.375rem] shrink-0 place-items-center rounded-full border-[1.5px]",
                        done ? "border-primary bg-primary text-white" : "border-border",
                      )}
                    >
                      {done && <Check className="size-3" strokeWidth={2.4} />}
                    </span>
                    <span className="min-w-0 truncate">{step.title}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="min-w-0">
          {/* Progress reflects required questions answered, not position on the
              page — on a single page there is no "step 3 of 7" to report.
              Sticky so it stays readable while scrolling a long form. */}
          {resumedFrom && (
            <p className="mb-4 rounded-md border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
              Welcome back &mdash; we&rsquo;ve restored your answers. Carry on where you left off.
            </p>
          )}

          <div className="sticky top-[4.375rem] z-10 -mx-5 mb-6 border-b border-hairline-soft bg-surface/95 px-5 py-3 backdrop-blur sm:-mx-7 sm:px-7 lg:mx-0 lg:rounded-lg lg:border lg:border-border lg:bg-background/95 lg:px-5">
            <div className="flex items-center gap-3.5">
              <div
                className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2"
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Assessment completion"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {progressPct}%
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-y-5">
            {sectionState.map(({ step, fields, missingCount }) => {
              const bmiAnchorFieldKey = step.bmiInsertBeforeFieldKey;
              const bmiAnchorPresent =
                !!bmiAnchorFieldKey && fields.some((f) => f.id === bmiAnchorFieldKey);

              return (
                <section
                  key={step.id}
                  id={`section-${step.id}`}
                  ref={(el) => {
                    sectionRefs.current[step.id] = el;
                  }}
                  aria-labelledby={`heading-${step.id}`}
                  className="scroll-mt-32 rounded-lg border border-border bg-background p-6 shadow-hairline sm:p-7"
                >
                  <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-hairline-soft pb-3">
                    <h2 id={`heading-${step.id}`} className="text-[1.375rem]">
                      {step.title}
                    </h2>
                    {showErrors && missingCount > 0 && (
                      <span className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.05em] text-destructive">
                        {missingCount} left
                      </span>
                    )}
                  </div>

                  {/* One flat, evenly-spaced stack. `space-y-10` here is what
                      separates questions — the children deliberately carry no
                      margin of their own.

                      flatMap, not map-with-a-wrapper: wrapping each field in
                      its own <div> so BmiField could be injected before its
                      anchor made every FieldRenderer root an only child, which
                      silently defeated the `last:mb-0` those roots used to
                      carry and collapsed the gap between every question to
                      zero. Emitting BmiField and FieldRenderer as real siblings
                      means the container's spacing applies to both and can't be
                      broken by how a field happens to be nested. */}
                  <div className="space-y-10">
                    {fields.flatMap((field, index) => {
                      // BMI is a composite (height + weight) not representable as a single
                      // FieldDef — inserted right before the section's anchor question
                      // (bmiInsertBeforeFieldKey, seeded as "occupation" on basic-info).
                      // Falls back to rendering first in the section if that question is
                      // missing (e.g. an admin deleted/renamed it), rather than silently
                      // dropping BMI from the form entirely.
                      const showBmi =
                        !!bmiAnchorFieldKey &&
                        (bmiAnchorPresent ? field.id === bmiAnchorFieldKey : index === 0);

                      return [
                        ...(showBmi
                          ? [<BmiField key="bmi" answers={answers} onChange={handleFieldChange} />]
                          : []),
                        <FieldRenderer
                          key={field.id}
                          field={field}
                          answers={answers}
                          onChange={handleFieldChange}
                        />,
                      ];
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Submit row. The error message and the button are in one flex row
              aligned to the same centre line, rather than the old right-stacked
              column where the message sat above the button and shifted it down
              the page the moment it appeared. */}
          <div className="mt-8 flex flex-wrap items-center justify-end gap-x-5 gap-y-3">
            {showErrors && !isComplete && (
              <p role="alert" className="text-sm text-destructive">
                {totalMissing} required question{totalMissing === 1 ? "" : "s"} still to answer.
              </p>
            )}
            <Button type="button" variant="default" onClick={handleSubmit}>
              Complete assessment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
