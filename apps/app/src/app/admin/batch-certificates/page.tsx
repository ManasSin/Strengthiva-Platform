"use client";

import { useEffect, useState } from "react";
import { api, ApiError, API_URL, type AdminBatch } from "@/lib/api-client";

// Replaces static/certificates-admin.html with a real, authenticated
// equivalent — see docs/platform-architecture/tech-specs/backend/
// admin-authentication.md and batch-certificates.md. Calls the same FastAPI
// endpoints (app/routers/certificates.py), via the logged-in admin's session
// cookie instead of a shared X-Admin-Key.
export default function BatchCertificatesPage() {
  const [batches, setBatches] = useState<AdminBatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [batchNumber, setBatchNumber] = useState("");
  const [productName, setProductName] = useState("");
  const [busyBatchId, setBusyBatchId] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setBatches(await api.listBatches());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load batches.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreateBatch() {
    if (!batchNumber.trim()) {
      setError("Batch number is required.");
      return;
    }
    setError(null);
    try {
      await api.createBatch(batchNumber.trim(), productName.trim() || null);
      setBatchNumber("");
      setProductName("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to create batch.");
    }
  }

  async function handleUploadCertificate(batchId: string, file: File) {
    setBusyBatchId(batchId);
    setError(null);
    try {
      await api.uploadCertificate(batchId, file);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload failed.");
    } finally {
      setBusyBatchId(null);
    }
  }

  async function handleVet(batchId: string, certificateId: string) {
    const vettedBy = window.prompt("Your name (recorded as vetted_by):");
    if (!vettedBy) return;
    setError(null);
    try {
      await api.vetCertificate(batchId, certificateId, vettedBy);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Vetting failed.");
    }
  }

  return (
    <div className="flex flex-col gap-y-6">
      <h1 className="text-xl font-semibold">Batch Certificates</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="rounded-lg border bg-background p-5">
        <div className="font-medium mb-3">Create a new batch</div>
        <div className="flex gap-2 flex-wrap">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Batch number (e.g. B12345678-AB)"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Product name (optional)"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
          <button
            className="rounded bg-primary text-white px-4 py-2 text-sm"
            onClick={handleCreateBatch}
          >
            Create batch
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-y-4">
        {batches.map((batch) => (
          <div key={batch.id} className="rounded-lg border bg-background p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{batch.batch_number}</div>
                {batch.product_name && (
                  <div className="text-sm text-gray-500">{batch.product_name}</div>
                )}
                <a
                  href={batch.verify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline"
                >
                  {batch.verify_url}
                </a>
              </div>
              {/* crossOrigin is required so the browser sends the session cookie
                  cross-origin to FastAPI, same as fetch's credentials:"include" —
                  a plain <img src> would omit it and 401. */}
              <img
                src={`${API_URL}/api/v1/admin/batches/${batch.id}/qr`}
                crossOrigin="use-credentials"
                alt="QR code"
                className="w-20 h-20 border rounded"
              />
            </div>

            <div className="mt-4">
              {batch.certificates.length === 0 ? (
                <div className="text-sm text-gray-400">No certificates uploaded yet.</div>
              ) : (
                <ul className="flex flex-col gap-y-1">
                  {batch.certificates.map((cert) => (
                    <li key={cert.id} className="text-sm flex items-center gap-2">
                      <span>{cert.original_filename}</span>
                      <span
                        className={
                          cert.status === "vetted" ? "text-green-700" : "text-amber-700"
                        }
                      >
                        {cert.status}
                      </span>
                      {cert.status === "pending" && (
                        <button
                          className="text-xs underline text-primary"
                          onClick={() => handleVet(batch.id, cert.id)}
                        >
                          Mark vetted
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3">
              <input
                type="file"
                accept="application/pdf"
                disabled={busyBatchId === batch.id}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadCertificate(batch.id, file);
                  e.target.value = "";
                }}
              />
              {busyBatchId === batch.id && (
                <span className="ml-2 text-sm text-gray-400">Uploading…</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
