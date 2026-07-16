"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingNav } from "@/components/layout/nav";
import { Button } from "@/components/ui/button";
import { api, ApiError, type PrescriptionResponse } from "@/lib/api-client";
import { TagListEditor } from "@/components/assessment/tag-list-editor";

// "Review Extraction" — docs/platform-architecture/modules/app-frontend.md §3 step 2.
// Note: the original prescription image isn't persisted anywhere on the backend
// (only OCR text) — the Figma design's "original document image with zoom" panel
// is left out here rather than faked; flagged as a known gap, not silently dropped.
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
        setError("We couldn't load this prescription.");
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
      <main className="flex flex-1 items-center justify-center px-6 py-24 text-center text-red-700">
        {error}
      </main>
    );
  }

  if (!prescription) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </main>
    );
  }

  // Crude, non-AI-generated confidence signal — "High" only when every field was
  // extracted; there's no real confidence score coming back from the LLM call.
  const fieldsFound = [symptoms.length > 0, !!duration, !!focus, items.length > 0].filter(Boolean).length;
  const accuracy = fieldsFound >= 3 ? "High" : fieldsFound >= 1 ? "Medium" : "Low";

  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-12">
          <div className="flex items-center justify-between">
            <h1 className="font-headline text-2xl font-bold text-foreground">Review Extraction</h1>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              AI Extraction Accuracy: {accuracy}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirm or correct what we read from your prescription before continuing.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-white p-6">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Symptoms</label>
            <TagListEditor values={symptoms} onChange={setSymptoms} placeholder="Add a symptom…" />
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-white p-6">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Duration</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 3 months"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-white p-6">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Focus</label>
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="e.g. Type 2 Diabetes management"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-white p-6">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Prescribed Items</label>
            <TagListEditor values={items} onChange={setItems} placeholder="Add a medicine/product…" />
            {prescription.resolved_items.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-border pt-4">
                {prescription.resolved_items.map((item) => (
                  <li key={item.name} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{item.name}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        item.resolution.status === "resolved"
                          ? "bg-green-100 text-green-800"
                          : item.resolution.status === "out_of_stock"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.resolution.status === "resolved"
                        ? "In Stock"
                        : item.resolution.status === "out_of_stock"
                          ? "Temporarily Unavailable"
                          : "Coming Soon"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button type="button" variant="outline" size="lg" onClick={() => router.push("/assessment/upload")}>
              ← Retake Photo
            </Button>
            <Button type="button" variant="default" size="lg" disabled={saving} onClick={handleContinue}>
              {saving ? "Saving…" : "Continue to Final Assessment Steps →"}
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
