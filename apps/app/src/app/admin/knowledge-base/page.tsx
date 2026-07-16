"use client";

import { useEffect, useState } from "react";
import { api, ApiError, type IndexedDocument } from "@/lib/api-client";

type DocType = "diet_chart" | "product_recommendation";

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: "diet_chart", label: "Diet Charts & Nutrition Plans" },
  { value: "product_recommendation", label: "Product & Supplement Catalogue" },
];

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

  async function handleUpload(docType: DocType, file: File) {
    setUploading(docType);
    setError(null);
    try {
      await api.indexFile(file, docType);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="flex flex-col gap-y-6">
      <h1 className="text-xl font-semibold">Knowledge Base</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {DOC_TYPES.map(({ value, label }) => (
        <div key={value} className="rounded-lg border bg-white p-5">
          <div className="font-medium">{label}</div>
          <div className="mt-3 text-sm text-gray-500">
            {documents[value].length === 0 ? (
              "No documents indexed yet."
            ) : (
              <ul className="list-disc list-inside">
                {documents[value].map((doc) => (
                  <li key={doc.document_id}>
                    {doc.filename} ({doc.chunk_count} chunks)
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-4">
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              disabled={uploading === value}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(value, file);
                e.target.value = "";
              }}
            />
            {uploading === value && (
              <span className="ml-2 text-sm text-gray-400">Indexing…</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
