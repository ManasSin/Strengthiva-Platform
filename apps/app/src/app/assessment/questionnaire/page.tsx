"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, Zap } from "lucide-react";

import { AssessmentWizard } from "@/components/assessment/wizard";
import { FlowShell } from "@/components/assessment/flow-shell";
import { MarketingNav } from "@/components/layout/nav";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";
import type { Answers } from "@/lib/questionnaire-types";

// Health assessment wizard page — orchestrates submission per
// docs/platform-architecture/tech-specs/backend/health-assessment-and-reports.md:
// POST /health-assessments -> POST /reports -> redirect to the report page.
//
// When arriving from the prescription-upload path (?prescriptionId=...), pre-fills
// the illness fields from the prescription's extracted symptoms/duration and shows
// a "Smart Streamlining Active" banner — decided 2026-07-14: pre-fill only, no wizard
// steps are hidden/skipped (simpler and less brittle than trying to guess which
// fields a given prescription makes redundant).
//
// Restyled for the 2026-08 rebrand: the page now sits in FlowShell at step 2, so
// the stepper and the sage flow surface are shared with upload/review/plan rather
// than re-declared here.
function QuestionnaireContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prescriptionId = searchParams.get("prescriptionId");

  const [initialAnswers, setInitialAnswers] = useState<Answers | undefined>(
    prescriptionId ? undefined : {},
  );
  const [showStreamliningBanner, setShowStreamliningBanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The assessment survives a failed report: POST /health-assessments succeeds and is
  // persisted, then POST /reports (4 OpenAI calls, ~10-15s) is the fragile half — if the
  // API worker handling it dies mid-flight, the whole request is lost. Holding the id
  // here lets "Try again" re-run only the report step instead of making the user refill
  // the wizard, and stops each retry from writing a duplicate assessment row.
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!prescriptionId) return;
    api
      .getPrescription(prescriptionId)
      .then((prescription) => {
        const illnessParts = [
          prescription.symptoms.join(", "),
          prescription.duration ? `Duration: ${prescription.duration}` : "",
        ].filter(Boolean);
        setInitialAnswers({
          ...(prescription.symptoms.length > 0
            ? { "common-illnesses": "Yes, but manageable", "illness-detail": illnessParts.join(" — ") }
            : {}),
          ...(prescription.patient_name ? { name: prescription.patient_name } : {}),
          ...(prescription.age !== null ? { age: String(prescription.age) } : {}),
          ...(prescription.gender ? { gender: prescription.gender } : {}),
          ...(prescription.height_cm !== null ? { "height-cm": String(prescription.height_cm) } : {}),
          ...(prescription.weight_kg !== null ? { "weight-kg": String(prescription.weight_kg) } : {}),
        });
        setShowStreamliningBanner(true);
      })
      .catch(() => setInitialAnswers({}));
  }, [prescriptionId]);

  async function handleComplete(answers: Answers, photoKey: string | null) {
    setSubmitting(true);
    setError(null);
    try {
      // Reuse the assessment from a previous failed attempt rather than creating a
      // second one for the same answers.
      const id =
        assessmentId ??
        (await api.createHealthAssessment(answers, prescriptionId ?? undefined, photoKey)).id;
      setAssessmentId(id);
      const report = await api.createReport(id);
      router.push(`/report/${report.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        const redirect = prescriptionId
          ? `/assessment/questionnaire?prescriptionId=${prescriptionId}`
          : "/assessment/questionnaire";
        router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }
      setError("We couldn't generate your report. Please try again.");
      setSubmitting(false);
    }
  }

  // Retries just the report generation for the already-saved assessment — the wizard
  // answers are not needed again, so this is safe to call with no arguments.
  async function retryReport() {
    if (!assessmentId) return;
    setSubmitting(true);
    setError(null);
    try {
      const report = await api.createReport(assessmentId);
      router.push(`/report/${report.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent("/assessment/questionnaire")}`);
        return;
      }
      setError("We couldn't generate your report. Please try again.");
      setSubmitting(false);
    }
  }

  // Report generation is ~10-15s of LLM calls. Full-bleed status screen rather
  // than a spinner over the form: there is nothing on the form worth looking at
  // while it runs, and leaving it visible invited a second submit.
  if (submitting) {
    return (
      <>
        <MarketingNav />
        <main className="flex flex-1 flex-col items-center justify-center bg-leaf-motif px-6 py-24 text-center">
          <div className="size-12 rounded-full border-[3px] border-border border-t-primary motion-safe:animate-spin" />
          <h1 className="mt-6 text-[1.75rem]">Reading your answers…</h1>
          <p className="mt-2 text-[0.9375rem] text-muted-foreground">
            Working out your constitution and where it&rsquo;s currently out of balance.
          </p>
        </main>
      </>
    );
  }

  if (initialAnswers === undefined) {
    return (
      <FlowShell step="questions" completed={["upload"]} width="wide">
        <div className="flex justify-center py-24">
          <div className="size-10 rounded-full border-[3px] border-border border-t-primary motion-safe:animate-spin" />
          <span className="sr-only">Loading your report details</span>
        </div>
      </FlowShell>
    );
  }

  return (
    <FlowShell
      step="questions"
      completed={prescriptionId ? ["upload"] : []}
      back={{ href: "/assessment", label: "Back" }}
      width="wide"
    >
      {error && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span className="flex items-start gap-2.5">
            <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} />
            {error}
          </span>
          {assessmentId && (
            <Button type="button" variant="destructive" size="sm" onClick={retryReport}>
              Try again
            </Button>
          )}
        </div>
      )}
      <AssessmentWizard
        onComplete={handleComplete}
        initialAnswers={initialAnswers}
        banner={
          showStreamliningBanner ? (
            <div className="mb-6 flex items-start gap-2.5 rounded-md border border-accent bg-accent/15 px-4 py-3 text-sm text-neutral">
              <Zap className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.7} />
              <span>
                <strong className="font-semibold">Smart streamlining active</strong> —
                we&rsquo;ve pre-filled what your report told us. Review and adjust anything
                before continuing.
              </span>
            </div>
          ) : null
        }
      />
    </FlowShell>
  );
}

export default function QuestionnairePage() {
  return (
    <Suspense fallback={null}>
      <QuestionnaireContent />
    </Suspense>
  );
}
