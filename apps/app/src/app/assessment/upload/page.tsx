"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, Lock, Upload } from "lucide-react";

import { FlowShell } from "@/components/assessment/flow-shell";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";

// Prescription upload — step 1 of the flow
// (docs/platform-architecture/modules/app-frontend.md §3).
//
// Backend only accepts image/* (app/routers/prescriptions.py). The reference
// screenshot's caption says "PDF or photo · up to 20 MB"; the file picker here
// stays restricted to images at the real 10MB limit rather than advertising a
// format that fails server-side. Copy below reflects what the API actually does.
//
// Restyled for the 2026-08 rebrand against docs/redesign/report upload page.png.
export default function PrescriptionUploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG or JPEG).");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const prescription = await api.uploadPrescription(file);
      router.push(`/assessment/review/${prescription.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent("/assessment/upload")}`);
        return;
      }
      setError(
        err instanceof ApiError
          ? err.message || "We couldn't read that report. Please try another photo."
          : "We couldn't read that report. Please try another photo.",
      );
      setUploading(false);
    }
  }

  return (
    <FlowShell step="upload" back={{ href: "/assessment", label: "Back" }}>
      <header className="mb-6 max-w-[46rem]">
        <h1 className="text-[clamp(1.75rem,4vw,2.375rem)]">
          Have a recent lab report? Start with what you already have.
        </h1>
        <p className="mt-3 max-w-[54ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
          Upload a photo and we&rsquo;ll read the key values for you — so the questions that
          follow are shorter and smarter. This step is optional; you can skip straight to the
          assessment.
        </p>
      </header>

      {uploading ? (
        <div className="rounded-lg border border-border bg-background px-8 py-14 text-center">
          {/* Ring keeps its shape under prefers-reduced-motion (the animation is
              dropped by motion-safe, not the border) so it still reads as a
              status indicator beside the text rather than vanishing. */}
          <div className="mx-auto size-10 rounded-full border-[3px] border-border border-t-primary motion-safe:animate-spin" />
          <h2 className="mt-5 text-subhead">Reading your report…</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This takes a few seconds. Nothing is saved until you confirm it.
          </p>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          className={`rounded-lg border-[1.5px] border-dashed px-6 py-12 text-center transition-colors sm:px-8 sm:py-14 ${
            dragging ? "border-primary bg-surface-2" : "border-foreground/25 bg-surface"
          }`}
        >
          <Upload className="mx-auto size-11 text-primary" strokeWidth={1.7} />
          <h2 className="mt-4 font-display text-[1.3125rem]">Drag a report here, or browse</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            PNG or JPEG · up to 10 MB · we read it, you confirm it
          </p>

          {/* The dropzone is no longer itself a click target. It used to be a
              plain <div> with onClick, which put a 400px-tall unlabelled hit
              area in front of a keyboard user with nothing to focus. The two
              real controls are buttons, centred as a proper flex row so they
              share a baseline instead of relying on inline-block whitespace. */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button type="button" variant="default" onClick={() => inputRef.current?.click()}>
              Browse files
            </Button>
            {/* The reference's companion button here is "Use a sample report",
                which would load a canned lab report — there is no such fixture
                in the product, so this points at the sample *plan* instead: a
                real page, and the same reassurance ("show me what I get")
                without pretending a feature exists. */}
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/sample-plan")}
            >
              See a sample plan
            </Button>
          </div>

          <p className="mt-5 flex items-center justify-center gap-2 text-[0.78125rem] text-muted-foreground">
            <Lock className="size-[0.9375rem] shrink-0 text-primary" strokeWidth={1.7} />
            Encrypted on upload · read once · never shared
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Choose a report to upload"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} />
          {error}
        </p>
      )}

      {/* Centred as a flex row rather than `text-center` on a block: the quiet
          link is an inline-flex control, and text-center on its parent left it
          optically off-centre against the dropzone above whenever the arrow
          glyph rendered at a different advance width. */}
      <div className="mt-7 flex justify-center">
        <Button
          type="button"
          variant="link"
          onClick={() => router.push("/assessment/questionnaire")}
        >
          Don&rsquo;t have a report handy? Skip to the assessment
          <ArrowRight className="size-4" strokeWidth={1.7} />
        </Button>
      </div>
    </FlowShell>
  );
}
