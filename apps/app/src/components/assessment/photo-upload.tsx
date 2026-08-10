"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CircleAlert, X } from "lucide-react";

import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

// Optional self-photo, offered at the very end of the assessment and shown beside the
// summary on the report.
//
// Uploaded immediately on selection rather than held until submit, for two reasons: the
// upload is the slowest part of finishing (a phone photo is several MB), and doing it
// here means "Complete assessment" stays instant instead of appearing to hang. The
// server returns a storage key, which the wizard submits alongside the answers.
//
// Optional means optional: every failure path below leaves the user able to continue.
// A photo that won't upload must never block someone from finishing their assessment.

const MAX_MB = 10;

export function PhotoUpload({
  onPhotoKeyChange,
}: {
  onPhotoKeyChange: (key: string | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Object URLs are a manual allocation — without this the blob stays held for the life
  // of the document, which matters here because the file is a multi-MB photo.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("That doesn't look like an image. Please choose a photo.");
      return;
    }
    // Checked here as well as on the server so a 10 MB phone photo fails instantly
    // rather than after a long upload on mobile data.
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`That image is over ${MAX_MB} MB. Please choose a smaller one.`);
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const { photo_key } = await api.uploadAssessmentPhoto(file);
      onPhotoKeyChange(photo_key);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "We couldn't upload that photo. You can skip it.",
      );
      // Drop the preview so the UI can't imply a photo is attached when it isn't.
      setPreview(null);
      onPhotoKeyChange(null);
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
    onPhotoKeyChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section
      aria-labelledby="heading-photo"
      className="scroll-mt-32 rounded-lg border border-border bg-background p-6 shadow-hairline sm:p-7"
    >
      <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-hairline-soft pb-3">
        <h2 id="heading-photo" className="text-[1.375rem]">
          A photo of you
        </h2>
        <span className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.05em] text-muted-foreground">
          Optional
        </span>
      </div>

      <p className="mb-5 text-[0.9375rem] leading-relaxed text-muted-foreground">
        If you&rsquo;d like, add a recent photo. It appears alongside your reading on your
        plan. You can skip this &mdash; it won&rsquo;t change your recommendations.
      </p>

      <div className="flex flex-wrap items-center gap-5">
        {preview ? (
          // Square here to match how it is displayed on the report, so what you pick is
          // what you get rather than a surprise crop later.
          <div className="relative size-28 shrink-0 overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview, not a
                remote asset; next/image cannot optimise an object URL. */}
            <img src={preview} alt="Your selected photo" className="size-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 grid place-items-center bg-background/70">
                <div className="size-6 rounded-full border-2 border-border border-t-primary motion-safe:animate-spin" />
              </div>
            )}
            <button
              type="button"
              onClick={clear}
              aria-label="Remove photo"
              className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-background/90 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="grid size-28 shrink-0 place-items-center rounded-lg border border-dashed border-border text-muted-foreground">
            <Camera className="size-7" strokeWidth={1.5} />
          </div>
        )}

        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            id="assessment-photo"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading…" : preview ? "Choose a different photo" : "Add a photo"}
          </Button>
          {error && (
            <p role="alert" className="mt-2.5 flex items-start gap-2 text-sm text-destructive">
              <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} />
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
