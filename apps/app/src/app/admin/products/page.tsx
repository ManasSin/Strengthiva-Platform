"use client";

import { useState } from "react";
import { api, ApiError, type ProductImportResult } from "@/lib/api-client";

// Bulk product upload. One CSV upload does two writes per row (see
// app/routers/product_import.py): it upserts the product in Medusa AND upserts this
// service's product_mappings row, so the Medusa catalogue and the AI's
// name→product mapping stay in step from a single place in the app's /admin.

// Kept in sync with REQUIRED_COLUMNS / KNOWN_COLUMNS in
// strengthiva-backend/app/routers/product_import.py.
const TEMPLATE_HEADER = "mapping_name,title,sku,price_inr,inventory_qty,description,thumbnail_url";
const TEMPLATE_EXAMPLE =
  "Ashwagandha Tablet,Ashwagandha Tablet,ASHWA-60,249,1000,Supports stress and sleep,";

function downloadTemplate() {
  const blob = new Blob([`${TEMPLATE_HEADER}\n${TEMPLATE_EXAMPLE}\n`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "product-import-template.csv";
  a.click();
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
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-y-6">
      <h1 className="text-xl font-semibold">Products</h1>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Uploaded products go <strong>live</strong> in the store immediately (created as
        published) and update this service&apos;s AI product mapping. Rows are matched to
        existing products by <strong>SKU</strong>: a known SKU updates price, stock, title
        and description in place; a new SKU creates the product. Re-uploading a corrected
        sheet is safe.
      </div>

      <div className="rounded-lg border bg-background p-5">
        <div className="font-medium">CSV format</div>
        <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
          <li>
            <code>title</code>, <code>sku</code>, <code>price_inr</code>,{" "}
            <code>inventory_qty</code> — required.
          </li>
          <li>
            <code>mapping_name</code> — the exact product name the AI uses in reports; if
            blank, the title is used. <code>description</code>, <code>thumbnail_url</code> —
            optional.
          </li>
          <li>
            <code>price_inr</code> is whole rupees (e.g. <code>249</code> for ₹249).
          </li>
        </ul>
        <button
          type="button"
          onClick={downloadTemplate}
          className="mt-3 text-sm text-primary underline"
        >
          Download template CSV
        </button>
      </div>

      <div className="rounded-lg border bg-background p-5">
        <div className="font-medium">Upload</div>
        <div className="mt-3">
          <input
            type="file"
            accept=".csv"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          {uploading && <span className="ml-2 text-sm text-gray-400">Importing…</span>}
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {result && (
        <div className="rounded-lg border bg-background p-5">
          <div className="font-medium">
            Import finished — {result.created} created, {result.updated} updated,{" "}
            {result.errors} failed
          </div>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-1 pr-4">Row</th>
                <th className="py-1 pr-4">SKU</th>
                <th className="py-1 pr-4">Name</th>
                <th className="py-1 pr-4">Result</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr key={r.row} className="border-b last:border-0 align-top">
                  <td className="py-1 pr-4 text-gray-400">{r.row}</td>
                  <td className="py-1 pr-4">{r.sku ?? "—"}</td>
                  <td className="py-1 pr-4">{r.mapping_name ?? "—"}</td>
                  <td className="py-1 pr-4">
                    {r.status === "error" ? (
                      <span className="text-red-600">Error — {r.detail}</span>
                    ) : (
                      <span className="text-green-700">{r.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
