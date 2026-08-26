"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CircleAlert } from "lucide-react";

import { FlowShell } from "@/components/assessment/flow-shell";
import { PhotoUpload } from "@/components/assessment/photo-upload";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";

// The optional self-photo, as its own step between submitting the answers and
// seeing the plan.
//
// Why it is here and not at the foot of the questionnaire: generating a report is
// ~10-15s of OpenAI + Qdrant work, and that used to start only after the user had
// finished choosing a photo. It now starts the instant the answers are submitted, so
// this screen and the generation overlap. Nothing on this page blocks the report —
// the photo never reaches the AI layer; it is shown beside the reading on the plan.
//
// The report id is already in the URL by the time this renders, which is the real
// safety net: POST /reports creates the row as `pending` and returns immediately, so
// /report/{id} is a live address even mid-generation. If this page is closed, the
// phone backgrounds it while the picker is open, or the upload fails, the plan is
// still reachable — nothing here is load-bearing.
function PhotoStepContent() {
  const router = useRouter();
  const params = useSearchParams();
  const reportId = params.get("reportId");
  const assessmentId = params.get("assessmentId");

  const [photoKey, setPhotoKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Falling back to the reports list rather than 404-ing: someone who lands here
  // without a reportId (hand-typed URL, stale bookmark) should still be given a way
  // to their plans.
  const planHref = reportId ? `/report/${reportId}` : "/account/reports";

  async function goToPlan(withPhoto: boolean) {
    // Skipping is a straight navigation — no request, nothing to fail, no spinner.
    if (!withPhoto || !photoKey || !assessmentId) {
      router.push(planHref);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.attachAssessmentPhoto(assessmentId, photoKey);
      router.push(planHref);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(planHref)}`);
        return;
      }
      // A photo that won't attach must never strand someone short of their plan —
      // the report is generated and waiting either way, so the message says so
      // instead of implying the whole thing failed.
      setError("We couldn't attach your photo. Your plan is ready either way.");
      setSaving(false);
    }
  }

  return (
    <FlowShell step="photo" completed={["questions"]} width="narrow">
      <header className="mb-6 max-w-[46rem]">
        <h1 className="text-[clamp(1.75rem,4vw,2.375rem)]">
          While we read your answers — add a photo?
        </h1>
        <p className="mt-3 max-w-[54ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
          Your reading is being prepared right now. If you&rsquo;d like, add a recent photo
          to keep alongside it on your plan. It won&rsquo;t change your recommendations, and
          skipping costs you nothing.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-background p-6 shadow-hairline sm:p-7">
        <PhotoUpload onPhotoKeyChange={setPhotoKey} />

        {error && (
          <p
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} />
            {error}
          </p>
        )}

        {/* Both actions grouped left in reading order. "Skip" is a real, equal
            option rather than a de-emphasised escape hatch — the step is genuinely
            optional and the UI should not imply otherwise. */}
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button type="button" variant="default" disabled={saving} onClick={() => goToPlan(true)}>
            {saving ? "Saving…" : photoKey ? "Use this photo — see my plan" : "See my plan"}
            {!saving && <ArrowRight strokeWidth={1.7} />}
          </Button>
          {photoKey && (
            <Button type="button" variant="secondary" onClick={() => goToPlan(false)}>
              Skip the photo
            </Button>
          )}
        </div>
      </section>
    </FlowShell>
  );
}

export default function PhotoStepPage() {
  return (
    <Suspense fallback={null}>
      <PhotoStepContent />
    </Suspense>
  );
}
