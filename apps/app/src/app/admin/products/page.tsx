"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api, ApiError, type ProductImportResult } from "@/lib/api-client";
import { Icon } from "@strengthiva/transparency/ui";

const TEMPLATE_HEADER = "mapping_name,title,sku,price_inr,inventory_qty,description,thumbnail_url";
const TEMPLATE_EXAMPLE =
  "Ashwagandha Tablet,Ashwagandha Tablet,ASHWA-60,249,1000,Supports stress and sleep,";

function downloadTemplate() {
  const blob = new Blob([`${TEMPLATE_HEADER}\n${TEMPLATE_EXAMPLE}\n`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "product-import-template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminProductsPage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductImportResult | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await api.importProductsCsv(file));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-2 sm:py-6">
      <header className="max-w-3xl">
        <h1 className="font-display text-title text-foreground">Products</h1>
        <p className="mt-3 text-[0.98rem] leading-7 text-muted-foreground">
          Import your product catalogue once to update the storefront and the names used in AI recommendations.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-background" aria-labelledby="catalogue-import-title">
        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)] lg:gap-12">
          <div>
            <span className="flex size-11 items-center justify-center rounded-xl bg-sage-soft text-foreground">
              <Icon name="upload" className="size-5" />
            </span>
            <h2 id="catalogue-import-title" className="mt-5 font-display text-heading text-foreground">
              Import a catalogue CSV
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Existing products are updated by SKU. New SKUs create published products and receive an AI mapping in the same import.
            </p>

            <label className="mt-6 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-foreground/25 bg-surface px-5 text-center transition-colors hover:border-primary hover:bg-sage-soft/35 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
              <Icon name="upload" className="size-6 text-primary" />
              <span className="mt-3 text-sm font-semibold text-foreground">
                {uploading ? "Importing catalogue…" : "Choose a CSV to import"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">CSV files only</span>
              <input
                className="sr-only"
                type="file"
                accept=".csv"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleUpload(file);
                  event.target.value = "";
                }}
              />
            </label>
          </div>

          <aside className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <h2 className="font-display text-subhead text-foreground">Before you import</h2>
            <ol className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sage-soft text-xs font-semibold text-foreground">1</span>
                <span>Use a stable SKU for each product so corrected imports update the right catalogue item.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sage-soft text-xs font-semibold text-foreground">2</span>
                <span>Set <code className="rounded bg-surface-2 px-1 py-0.5 text-[0.78rem] text-foreground">mapping_name</code> when the AI uses a different product name.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sage-soft text-xs font-semibold text-foreground">3</span>
                <span>Review the outcome below before sharing the updated catalogue.</span>
              </li>
            </ol>
            <Button variant="link" size="sm" onClick={downloadTemplate} className="mt-6">
              Download the CSV template
              <Icon name="download" className="size-4" />
            </Button>
          </aside>
        </div>
        <div className="border-t border-border bg-surface px-5 py-4 text-sm leading-6 text-muted-foreground sm:px-7">
          <strong className="font-semibold text-foreground">Published immediately.</strong> Imported products are visible in the store as soon as their row succeeds. Price is in whole rupees, such as <code className="rounded bg-background px-1 py-0.5 text-[0.78rem] text-foreground">249</code> for ₹249.
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <section className="overflow-hidden rounded-2xl border border-border bg-background" aria-labelledby="import-result-title">
          <div className="flex flex-wrap items-end justify-between gap-4 p-5 sm:p-7">
            <div>
              <h2 id="import-result-title" className="font-display text-heading text-foreground">Import result</h2>
              <p className="mt-2 text-sm text-muted-foreground">Each row is listed so you can correct and retry any failures.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-sage-soft px-3 py-1.5 text-foreground">{result.created} created</span>
              <span className="rounded-full bg-surface px-3 py-1.5 text-foreground">{result.updated} updated</span>
              {result.errors > 0 && <span className="rounded-full bg-destructive/10 px-3 py-1.5 text-destructive">{result.errors} failed</span>}
            </div>
          </div>
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="bg-surface text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 sm:px-7">Row</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3 sm:px-7">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.rows.map((row) => (
                  <tr key={row.row} className="align-top">
                    <td className="px-5 py-3.5 text-muted-foreground sm:px-7">{row.row}</td>
                    <td className="px-5 py-3.5 text-foreground">{row.sku ?? "—"}</td>
                    <td className="px-5 py-3.5 text-foreground">{row.mapping_name ?? "—"}</td>
                    <td className="px-5 py-3.5 sm:px-7">
                      {row.status === "error" ? (
                        <span className="text-destructive">Error — {row.detail}</span>
                      ) : (
                        <span className="text-primary">{row.status === "created" ? "Created" : "Updated"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
