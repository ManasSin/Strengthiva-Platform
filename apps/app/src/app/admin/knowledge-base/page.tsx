"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DestructiveConfirmDialog } from "@/components/admin/destructive-confirm-dialog";
import { api, ApiError, type IndexedDocument } from "@/lib/api-client";
import { Icon } from "@strengthiva/transparency/ui";

type DocType = "diet_chart" | "product_recommendation";

const DOC_TYPES: { value: DocType; label: string; description: string }[] = [
  {
    value: "diet_chart",
    label: "Diet charts & nutrition plans",
    description: "Source documents used to ground personalised diet guidance.",
  },
  {
    value: "product_recommendation",
    label: "Product & supplement catalogue",
    description: "Source documents used to support product recommendations.",
  },
];

type UploadProgress = { done: number; total: number; current: string };
type FileError = { filename: string; message: string };

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
  const [documentToRemove, setDocumentToRemove] = useState<{
    docType: DocType;
    document: IndexedDocument;
  } | null>(null);
  const [removeAllType, setRemoveAllType] = useState<DocType | null>(null);
  const [removingAll, setRemovingAll] = useState<DocType | null>(null);

  async function load() {
    setError(null);
    try {
      const results = await Promise.all(DOC_TYPES.map((type) => api.indexDocuments(type.value)));
      setDocuments({
        diet_chart: results[0].documents,
        product_recommendation: results[1].documents,
      });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Failed to load indexed documents.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(docType: DocType, files: File[]) {
    setUploading(docType);
    setError(null);
    setFileErrors([]);

    const failures: FileError[] = [];
    for (const [index, file] of files.entries()) {
      setProgress({ done: index, total: files.length, current: file.name });
      try {
        await api.indexFile(file, docType);
      } catch (cause) {
        failures.push({
          filename: file.name,
          message: cause instanceof ApiError ? cause.message : "Upload failed.",
        });
      }
    }

    setFileErrors(failures);
    setProgress(null);
    setUploading(null);
    await load();
  }

  async function handleDelete(docType: DocType, document: IndexedDocument) {
    setDeleting(document.document_id);
    setError(null);
    try {
      await api.deleteIndexedDocument(document.document_id, docType);
      setDocumentToRemove(null);
      await load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Failed to remove the document.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRemoveAll() {
    if (!removeAllType) return;
    setRemovingAll(removeAllType);
    setError(null);
    try {
      await api.deleteIndexedDocuments(removeAllType);
      setRemoveAllType(null);
      await load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Failed to remove indexed files.");
    } finally {
      setRemovingAll(null);
    }
  }

  const pendingRemoval = removeAllType
    ? DOC_TYPES.find((type) => type.value === removeAllType)
    : null;
  const pendingDocuments = removeAllType ? documents[removeAllType] : [];
  const pendingChunks = pendingDocuments.reduce((sum, document) => sum + document.chunk_count, 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-2 sm:py-6">
      <header className="max-w-3xl">
        <h1 className="font-display text-title text-foreground">Knowledge base</h1>
        <p className="mt-3 text-[0.98rem] leading-7 text-muted-foreground">
          Upload and maintain the documents that inform diet guidance and product
          recommendations.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {fileErrors.length > 0 && (
        <section className="rounded-2xl border border-destructive/25 bg-destructive/10 p-5 text-sm text-destructive" aria-labelledby="upload-errors-title">
          <h2 id="upload-errors-title" className="font-semibold">
            {fileErrors.length} file{fileErrors.length === 1 ? "" : "s"} could not be indexed
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-1">
            {fileErrors.map((file) => (
              <li key={file.filename}>
                {file.filename} — {file.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
        {DOC_TYPES.map(({ value, label, description }) => {
          const entries = documents[value];
          const chunks = entries.reduce((sum, document) => sum + document.chunk_count, 0);
          const isBusy = uploading === value || removingAll === value;
          return (
            <section key={value} className="p-5 sm:p-7" aria-labelledby={`${value}-title`}>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-sage-soft text-foreground">
                      <Icon name={value === "diet_chart" ? "file" : "layers"} className="size-5" />
                    </span>
                    <div>
                      <h2 id={`${value}-title`} className="font-display text-subhead text-foreground">
                        {label}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm text-muted-foreground">
                    {entries.length === 0
                      ? "No indexed files"
                      : `${entries.length} indexed file${entries.length === 1 ? "" : "s"} · ${chunks} chunks`}
                  </p>
                </div>
                {entries.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isBusy || deleting !== null}
                    onClick={() => setRemoveAllType(value)}
                  >
                    <Icon name="x" className="size-4" />
                    Remove all
                  </Button>
                )}
              </div>

              {entries.length > 0 && (
                <ul className="mt-5 divide-y divide-border rounded-xl border border-border bg-surface/50">
                  {entries.map((document) => (
                    <li key={document.document_id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{document.filename}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {document.chunk_count} chunks
                        </span>
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        disabled={isBusy || deleting === document.document_id}
                        onClick={() => setDocumentToRemove({ docType: value, document })}
                        className="shrink-0 border-b-destructive/55 text-destructive hover:border-b-destructive"
                      >
                        {deleting === document.document_id ? "Removing…" : "Remove"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-foreground/25 hover:bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
                  <Icon name="upload" className="size-4" />
                  Add files
                  <input
                    className="sr-only"
                    type="file"
                    multiple
                    accept=".pdf,.docx,.doc,.json,application/json"
                    disabled={isBusy}
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      if (files.length > 0) handleUpload(value, files);
                      event.target.value = "";
                    }}
                  />
                </label>
                {uploading === value && progress && (
                  <p className="text-sm text-muted-foreground" aria-live="polite">
                    Indexing {progress.done + 1} of {progress.total} — {progress.current}
                  </p>
                )}
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                PDF, Word, and structured JSON files are supported. Adding the same file again replaces its indexed content.
              </p>
            </section>
          );
        })}
      </div>

      {pendingRemoval && removeAllType && (
        <DestructiveConfirmDialog
          title={`Remove all ${pendingRemoval.label.toLowerCase()} files?`}
          description={
            <>
              This removes {pendingDocuments.length} indexed file{pendingDocuments.length === 1 ? "" : "s"} and {pendingChunks} chunks. The AI will stop using this material immediately. Re-upload the files to restore them.
            </>
          }
          confirmLabel="Remove all files"
          busy={removingAll === removeAllType}
          onCancel={() => setRemoveAllType(null)}
          onConfirm={handleRemoveAll}
        />
      )}

      {documentToRemove && (
        <DestructiveConfirmDialog
          title={`Remove ${documentToRemove.document.filename}?`}
          description={
            <>
              This removes {documentToRemove.document.chunk_count} indexed chunk
              {documentToRemove.document.chunk_count === 1 ? "" : "s"} from this file.
              The AI will stop using this material immediately. Re-upload the file to
              restore it.
            </>
          }
          confirmLabel="Remove file"
          busy={deleting === documentToRemove.document.document_id}
          onCancel={() => setDocumentToRemove(null)}
          onConfirm={() => handleDelete(documentToRemove.docType, documentToRemove.document)}
        />
      )}
    </div>
  );
}
