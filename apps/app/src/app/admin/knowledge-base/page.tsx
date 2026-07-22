"use client";

import { useEffect, useState } from "react";
import { api, ApiError, type IndexedDocument } from "@/lib/api-client";

type DocType = "diet_chart" | "product_recommendation";

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: "diet_chart", label: "Diet Charts & Nutrition Plans" },
  { value: "product_recommendation", label: "Product & Supplement Catalogue" },
];

type UploadProgress = { done: number; total: number; current: string };
type FileError = { filename: string; message: string };

// Replaces static/test-ui.html's Knowledge Base panel with a real,
// authenticated equivalent — see docs/platform-architecture/tech-specs/backend/
// admin-authentication.md. Calls the same FastAPI endpoints
// (app/routers/test_admin.py), just via the logged-in admin's session cookie
// instead of a shared X-Admin-Key.
export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<Record<DocType, IndexedDocument[]>>({
    diet_chart: [],
    product_recommendation: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<DocType | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [fileErrors, setFileErrors] = useState<FileError[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const results = await Promise.all(DOC_TYPES.map((t) => api.indexDocuments(t.value)));
      setDocuments({
        diet_chart: results[0].documents,
        product_recommendation: results[1].documents,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load indexed documents.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Files are indexed one at a time, deliberately not in parallel: indexing shares a
  // single process-wide SentenceTransformer instance and one Qdrant client, and
  // concurrent use of exactly those two is what rag.py's _retrieval_lock exists to
  // prevent (its comment documents a reproducible segfault). A failure on one file
  // is collected and the batch continues, so one bad document can't abandon the rest.
  async function handleUpload(docType: DocType, files: File[]) {
    setUploading(docType);
    setError(null);
    setFileErrors([]);

    const failures: FileError[] = [];
    for (const [i, file] of files.entries()) {
      setProgress({ done: i, total: files.length, current: file.name });
      try {
        await api.indexFile(file, docType);
      } catch (e) {
        failures.push({
          filename: file.name,
          message: e instanceof ApiError ? e.message : "Upload failed.",
        });
      }
    }

    setFileErrors(failures);
    setProgress(null);
    setUploading(null);
    await load();
  }

  async function handleDelete(docType: DocType, doc: IndexedDocument) {
    const confirmed = window.confirm(
      `Remove "${doc.filename}" and all ${doc.chunk_count} of its indexed chunks?\n\n` +
        "The AI will stop using this document immediately. This cannot be undone — " +
        "you would need to re-upload the file to restore it.",
    );
    if (!confirmed) return;

    setDeleting(doc.document_id);
    setError(null);
    try {
      await api.deleteIndexedDocument(doc.document_id, docType);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to remove the document.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-y-6">
      <h1 className="text-xl font-semibold">Knowledge Base</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {fileErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="font-medium">
            {fileErrors.length} file{fileErrors.length === 1 ? "" : "s"} could not be indexed:
          </div>
          <ul className="mt-2 list-inside list-disc">
            {fileErrors.map((f) => (
              <li key={f.filename}>
                {f.filename} — {f.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {DOC_TYPES.map(({ value, label }) => (
        <div key={value} className="rounded-lg border bg-white p-5">
          <div className="font-medium">{label}</div>
          <div className="mt-3 text-sm text-gray-500">
            {documents[value].length === 0 ? (
              "No documents indexed yet."
            ) : (
              <ul className="divide-y">
                {documents[value].map((doc) => (
                  <li key={doc.document_id} className="flex items-center justify-between py-2">
                    <span>
                      {doc.filename}{" "}
                      <span className="text-gray-400">({doc.chunk_count} chunks)</span>
                    </span>
                    <button
                      type="button"
                      disabled={deleting === doc.document_id}
                      onClick={() => handleDelete(value, doc)}
                      className="ml-4 shrink-0 text-red-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                    >
                      {deleting === doc.document_id ? "Removing…" : "Remove"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-4">
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.doc"
              disabled={uploading === value}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length > 0) handleUpload(value, files);
                e.target.value = "";
              }}
            />
            {uploading === value && progress && (
              <span className="ml-2 text-sm text-gray-400">
                Indexing {progress.done + 1} of {progress.total} — {progress.current}…
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
