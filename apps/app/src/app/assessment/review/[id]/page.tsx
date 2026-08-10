"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CircleAlert } from "lucide-react";

import { FlowShell } from "@/components/assessment/flow-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type PrescriptionResponse } from "@/lib/api-client";
import { TagListEditor } from "@/components/assessment/tag-list-editor";

// "Here's what we read" — step 1's confirmation screen
// (docs/platform-architecture/modules/app-frontend.md §3 step 2).
//
// Restyled for the 2026-08 rebrand against docs/redesign/report conformation
// page.png. The screenshot shows numeric lab analytes (Vitamin D, Hemoglobin,
// TSH …) with unit inputs and IN RANGE / LOW / WATCH flags; this endpoint
// returns prescription fields instead (symptoms, duration, focus, prescribed
// items), so what carries over is the *treatment* — one confirmation panel,
// hairline-separated rows, a name-and-hint label column against an editable
// value column, and the two CTAs grouped at the bottom left — applied to the
// fields that actually exist. The analyte rows are not faked.
//
// Note: the original image isn't persisted anywhere on the backend (only OCR
// text), so the reference's "original document, with zoom" panel is left out
// rather than mocked. Known gap, not a silent drop.
export default function ReviewExtractionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [prescription, setPrescription] = useState<PrescriptionResponse | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [focus, setFocus] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getPrescription(id)
      .then((p) => {
        setPrescription(p);
        setSymptoms(p.symptoms);
        setDuration(p.duration ?? "");
        setFocus(p.focus ?? "");
        setItems(p.prescribed_items);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        setError("We couldn't load this report.");
      });
  }, [id, router]);

  async function handleContinue() {
    setSaving(true);
    setError(null);
    try {
      await api.updatePrescription(id, {
        symptoms,
        duration: duration.trim() || null,
        focus: focus.trim() || null,
        prescribed_items: items,
      });
      router.push(`/assessment/questionnaire?prescriptionId=${id}`);
    } catch {
      setError("We couldn't save your changes. Please try again.");
      setSaving(false);
    }
  }

  if (error && !prescription) {
    return (
      <FlowShell step="upload" back={{ href: "/assessment/upload", label: "Back to upload" }}>
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} />
          {error}
        </p>
      </FlowShell>
    );
  }

  if (!prescription) {
    return (
      <FlowShell step="upload" back={{ href: "/assessment/upload", label: "Back to upload" }}>
        <div className="flex justify-center py-20">
          <div className="size-10 rounded-full border-[3px] border-border border-t-primary motion-safe:animate-spin" />
          <span className="sr-only">Loading your report</span>
        </div>
      </FlowShell>
    );
  }

  return (
    <FlowShell step="upload" back={{ href: "/assessment/upload", label: "Back to upload" }}>
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

      <section className="rounded-lg border border-border bg-background p-6 shadow-hairline sm:p-7">
        <div className="flex items-center gap-2.5">
          <Check className="size-5 shrink-0 text-primary" strokeWidth={1.7} />
          <h2 className="font-display text-subhead">Here&rsquo;s what we read</h2>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Confirm or correct anything before we carry it forward. Nothing is acted on until you
          say it&rsquo;s right.
        </p>

        <div className="mt-6 divide-y divide-hairline-soft border-t border-hairline-soft">
          <ReviewRow
            label="Symptoms"
            hint="What the report describes"
            control={
              <TagListEditor values={symptoms} onChange={setSymptoms} placeholder="Add a symptom…" />
            }
          />
          <ReviewRow
            label="Duration"
            hint="How long it's been going on"
            control={
              <Input
                id="review-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 3 months"
              />
            }
          />
          <ReviewRow
            label="Focus"
            hint="The condition being managed"
            control={
              <Input
                id="review-focus"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="e.g. Type 2 Diabetes management"
              />
            }
          />
          <ReviewRow
            label="Prescribed items"
            hint="Medicines and products named"
            control={
              <TagListEditor
                values={items}
                onChange={setItems}
                placeholder="Add a medicine/product…"
              />
            }
          />
        </div>

        {prescription.resolved_items.length > 0 && (
          <div className="mt-6 border-t border-hairline-soft pt-5">
            <h3 className="mb-3 font-mono text-label uppercase text-primary">
              What we can supply
            </h3>
            <ul className="space-y-2.5">
              {prescription.resolved_items.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-4 text-sm">
                  <span className="min-w-0 text-foreground">{item.name}</span>
                  <Badge
                    variant={item.resolution.status === "resolved" ? "flag" : "flag-watch"}
                    size="sm"
                  >
                    {item.resolution.status === "resolved"
                      ? "In stock"
                      : item.resolution.status === "out_of_stock"
                        ? "Unavailable"
                        : "Coming soon"}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-6 flex items-start gap-2.5 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} />
            {error}
          </p>
        )}

        {/* Both CTAs grouped left, in reading order, matching the reference.
            This row was `justify-between`, which threw the confirm button to
            the far right edge of the panel — a 700px gap from the action that
            precedes it, and on a narrow viewport the two collapsed into
            opposite corners of a wrapped row. */}
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button type="button" variant="default" disabled={saving} onClick={handleContinue}>
            {saving ? "Saving…" : "Looks right — continue"}
            {!saving && <ArrowRight strokeWidth={1.7} />}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/assessment/questionnaire")}
          >
            Skip, I&rsquo;ll just answer questions
          </Button>
        </div>
      </section>
    </FlowShell>
  );
}

/**
 * One confirmation row: name and hint on the left, the editable value on the
 * right, hairline between. Grid rather than flex so every row's value column
 * starts at the same x — with flex, a long label pushed its own input out of
 * line with the rows above and below it.
 */
function ReviewRow({
  label,
  hint,
  control,
}: {
  label: string;
  hint: string;
  control: React.ReactNode;
}) {
  return (
    <div className="grid items-center gap-x-6 gap-y-2 py-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
      <div>
        <Label className="text-[0.9375rem]">{label}</Label>
        <p className="mt-0.5 text-[0.78125rem] text-muted-foreground">{hint}</p>
      </div>
      <div className="min-w-0">{control}</div>
    </div>
  );
}
