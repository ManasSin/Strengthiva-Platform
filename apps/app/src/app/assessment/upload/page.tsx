"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingNav } from "@/components/layout/nav";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";

// Prescription upload — first step of the "Upload Existing Prescription" path
// (docs/platform-architecture/modules/app-frontend.md §3). Backend only accepts
// image/* (app/routers/prescriptions.py) — the Figma copy also mentions PDF, which
// isn't supported yet; restricting the file picker to images here rather than
// accepting PDF and failing server-side.
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
          ? err.message || "We couldn't read that prescription. Please try another photo."
          : "We couldn't read that prescription. Please try another photo.",
      );
      setUploading(false);
    }
  }

  return (
    <>
      <MarketingNav />
      <main className="flex-1 bg-leaf-motif">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-center font-headline text-3xl font-bold text-foreground">
            Upload Your Prescription
          </h1>
          <p className="mt-3 text-center text-muted-foreground">
            We&apos;ll read your doctor&apos;s notes and pre-fill what we can — you&apos;ll get a
            chance to review and correct everything before continuing.
          </p>

          {uploading ? (
            <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Reading your prescription…</p>
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
              onClick={() => inputRef.current?.click()}
              className={`mt-10 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 text-center transition-colors ${
                dragging ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40"
              }`}
            >
              <span className="text-4xl" aria-hidden>
                📄
              </span>
              <p className="mt-4 text-sm font-medium text-foreground">
                Drag & drop your prescription here, or click to browse
              </p>
              <p className="mt-1 text-xs text-muted-foreground">PNG or JPEG, up to 10MB</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-8 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.push("/assessment/questionnaire")}
            >
              Skip — take the health assessment instead
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
