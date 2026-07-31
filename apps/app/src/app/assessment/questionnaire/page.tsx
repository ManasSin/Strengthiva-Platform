"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AssessmentWizard } from "@/components/assessment/wizard";
import { api, ApiError } from "@/lib/api-client";
import type { Answers } from "@/lib/questionnaire-types";
import { MarketingNav } from "@/components/layout/nav";

// Health assessment wizard page — orchestrates submission per
// docs/platform-architecture/tech-specs/backend/health-assessment-and-reports.md:
// POST /health-assessments -> POST /reports -> redirect to the report page.
//
// When arriving from the prescription-upload path (?prescriptionId=...), pre-fills
// the illness fields from the prescription's extracted symptoms/duration and shows
// a "Smart Streamlining Active" banner — decided 2026-07-14: pre-fill only, no wizard
// steps are hidden/skipped (simpler and less brittle than trying to guess which
// fields a given prescription makes redundant).
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

  async function handleComplete(answers: Answers) {
    setSubmitting(true);
    setError(null);
    try {
      // Reuse the assessment from a previous failed attempt rather than creating a
      // second one for the same answers.
      const id = assessmentId ?? (await api.createHealthAssessment(answers, prescriptionId ?? undefined)).id;
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

  if (submitting) {
    return (
      <>
        <MarketingNav />
        <main className="flex flex-1 flex-col items-center justify-center bg-leaf-motif px-6 py-24 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <h1 className="mt-6 font-headline text-xl font-bold text-foreground">Analyzing…</h1>
          <p className="mt-2 text-sm text-muted-foreground">Determining your Ayurvedic constitution</p>
        </main>
      </>
    );
  }

  if (initialAnswers === undefined) {
    return (
      <>
        <MarketingNav />
        <main className="flex flex-1 items-center justify-center bg-leaf-motif px-6 py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </main>
      </>
    );
  }

  return (
    <>
      <MarketingNav />
      <main className="flex-1 bg-leaf-motif">
        {error && (
          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            {assessmentId && (
              <button
                type="button"
                onClick={retryReport}
                className="rounded-md bg-red-700 px-3 py-1.5 font-medium text-white hover:bg-red-800"
              >
                Try again
              </button>
            )}
          </div>
        )}
        <AssessmentWizard
          onComplete={handleComplete}
          initialAnswers={initialAnswers}
          banner={
            showStreamliningBanner ? (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
                <span aria-hidden>⚡</span>
                <span>
                  <strong>Smart Streamlining Active</strong> — we&apos;ve pre-filled what your
                  prescription told us. Review and adjust anything before continuing.
                </span>
              </div>
            ) : null
          }
        />
      </main>
    </>
  );
}

export default function QuestionnairePage() {
  return (
    <Suspense fallback={null}>
      <QuestionnaireContent />
    </Suspense>
  );
}
