"use client";
import { useState } from "react";
import Link from "next/link";
import type { DocumentKind } from "@strengthiva/transparency/types";
import {
  DOCUMENT_LABELS,
  DOCUMENT_SLOTS,
  matchDocument,
} from "@strengthiva/transparency/domain";
import {
  EmptyState,
  Icon,
  Loading,
  Notice,
  PageHead,
  Panel,
  Status,
} from "@strengthiva/transparency/ui";
import { transparencyApi } from "@/lib/transparency-api";
import {
  Action,
  Dropzone,
  ErrorNotice,
  Modal,
  useActiveRail,
} from "./controls";
import { BatchPicker, useBatchRecords } from "./batch-records";
type QueuedFile = {
  id: string;
  file: File;
  productId: string;
  kind: DocumentKind | "";
  state:
    | "matched"
    | "ambiguous"
    | "unmatched"
    | "uploading"
    | "attached"
    | "failed";
  error?: string;
};
export function DocumentsPage() {
  const context = useBatchRecords();
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [filter, setFilter] = useState("all");
  const filterRail = useActiveRail<HTMLDivElement>(filter);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  const [confirm, setConfirm] = useState<string[]>([]);
  const products = context.records.data || [];
  const ready = queue.filter(
    (row) =>
      row.productId &&
      row.kind &&
      !["attached", "uploading"].includes(row.state)
  );
  function add(files: File[]) {
    const invalid = files.filter((file) => !/\.pdf$/i.test(file.name));
    if (invalid.length)
      setError(
        new Error(
          `${invalid.length} file(s) were skipped. Only PDF files are accepted.`
        )
      );
    else setError(undefined);
    setQueue((current) => [
      ...current,
      ...files
        .filter((file) => /\.pdf$/i.test(file.name))
        .map((file) => ({
          id: crypto.randomUUID(),
          file,
          ...matchDocument(file.name, products),
        })),
    ]);
  }
  function update(id: string, patch: Partial<QueuedFile>) {
    setQueue((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }
  async function attach(ids: string[]) {
    setConfirm([]);
    setBusy(true);
    setError(undefined);
    for (const id of ids) {
      const row = queue.find((item) => item.id === id);
      if (!row?.productId || !row.kind || row.state === "attached") continue;
      update(id, { state: "uploading", error: undefined });
      try {
        await transparencyApi.upload(row.productId, row.file, row.kind);
        update(id, { state: "attached" });
      } catch (error) {
        update(id, { state: "failed", error: (error as Error).message });
      }
    }
    setBusy(false);
  }
  function review(ids: string[]) {
    setConfirm(ids);
  }
  const loading = context.batches.loading || context.records.loading;
  return (
    <>
      <PageHead
        eyebrow="Evidence library"
        title="Documents"
        copy="Upload product PDFs together, review their suggested matches, and attach them to the right records."
      />
      <Panel>
        <div className="toolbar">
          <BatchPicker
            batches={context.batches.data || []}
            batchId={context.batchId}
            disabled={busy || queue.some((row) => row.state !== "attached")}
            onChange={(id) => {
              context.setBatchId(id);
              setQueue([]);
            }}
          />
          {queue.length > 0 && (
            <Action disabled={busy} onClick={() => setQueue([])}>
              Clear upload queue
            </Action>
          )}
        </div>
        {context.batches.error && (
          <ErrorNotice
            error={context.batches.error}
            retry={context.batches.reload}
          />
        )}
        {context.records.error && (
          <ErrorNotice
            error={context.records.error}
            retry={context.records.reload}
          />
        )}
        {error && <ErrorNotice error={error} />}
        {loading ? (
          <Loading />
        ) : !products.length ? (
          <EmptyState
            title="No product records to attach to"
            action={
              <Link href="/admin/import" className="btn btn-primary">
                Import workbook
              </Link>
            }
          >
            Choose a batch with products or import your manufacturing workbook
            first.
          </EmptyState>
        ) : (
          <Dropzone
            accept=".pdf,application/pdf"
            multiple
            disabled={busy}
            onFiles={add}
            title="Drop your batch PDFs here"
            copy="Filenames can suggest a product and document type. You review every destination before files are attached."
          />
        )}
      </Panel>
      {queue.length > 0 && (
        <Panel
          className="section-gap"
          title="Review document matches"
          copy={`${queue.length} PDFs in this upload · ${
            queue.filter((row) => row.state === "attached").length
          } attached`}
          actions={
            <Action
              tone="primary"
              disabled={busy || !ready.length}
              onClick={() => review(ready.map((row) => row.id))}
            >
              {busy ? "Attaching…" : `Review & attach ${ready.length} PDFs`}
            </Action>
          }
        >
          <div
            ref={filterRail}
            className="tabs"
            role="group"
            aria-label="Filter document matches"
          >
            {[
              "all",
              "matched",
              "ambiguous",
              "unmatched",
              "failed",
              "attached",
            ].map((value) => (
              <button
                type="button"
                className={`tab ${filter === value ? "active" : ""}`}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                key={value}
              >
                {value[0].toUpperCase() + value.slice(1)}{" "}
                {value === "all"
                  ? queue.length
                  : queue.filter((row) => row.state === value).length}
              </button>
            ))}
          </div>
          <div className="document-queue">
            {queue
              .filter((row) => filter === "all" || row.state === filter)
              .map((row) => (
                <article className="upload-row" key={row.id}>
                  <div>
                    <strong>{row.file.name}</strong>
                    <span className="tiny muted">
                      {(row.file.size / 1024).toFixed(0)} KB
                    </span>
                    <Status
                      tone={
                        row.state === "attached"
                          ? "good"
                          : row.state === "failed"
                          ? "bad"
                          : row.state === "matched"
                          ? "info"
                          : "warn"
                      }
                      icon={row.state === "attached" ? "check" : "alert"}
                    >
                      {row.state}
                    </Status>
                    {row.error && (
                      <span className="field-error" role="alert">
                        {row.error}
                      </span>
                    )}
                  </div>
                  <label className="field">
                    <span>Product record</span>
                    <select
                      className="select"
                      disabled={busy || row.state === "attached"}
                      value={row.productId}
                      onChange={(event) =>
                        update(row.id, {
                          productId: event.target.value,
                          state:
                            event.target.value && row.kind
                              ? "matched"
                              : "unmatched",
                        })
                      }
                    >
                      <option value="">Choose product</option>
                      {products.map((product) => (
                        <option value={product.id} key={product.id}>
                          {product.product_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Document category</span>
                    <select
                      className="select"
                      disabled={busy || row.state === "attached"}
                      value={row.kind}
                      onChange={(event) =>
                        update(row.id, {
                          kind: event.target.value as DocumentKind,
                          state:
                            row.productId && event.target.value
                              ? "matched"
                              : "unmatched",
                        })
                      }
                    >
                      <option value="">Choose category</option>
                      {DOCUMENT_SLOTS.map((kind) => (
                        <option value={kind} key={kind}>
                          {DOCUMENT_LABELS[kind]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="cluster">
                    <Action
                      disabled={
                        busy ||
                        !row.productId ||
                        !row.kind ||
                        row.state === "attached"
                      }
                      onClick={() => review([row.id])}
                    >
                      {row.state === "failed"
                        ? "Retry"
                        : row.state === "attached"
                        ? "Attached"
                        : "Attach"}
                    </Action>
                    {row.state !== "attached" && (
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Remove ${row.file.name} from queue`}
                        disabled={busy}
                        onClick={() =>
                          setQueue((current) =>
                            current.filter((item) => item.id !== row.id)
                          )
                        }
                      >
                        <Icon name="x" />
                      </button>
                    )}
                  </div>
                </article>
              ))}
          </div>
          {!queue.some((row) => filter === "all" || row.state === filter) && (
            <EmptyState title="No files in this state">
              Choose another filter to review your upload queue.
            </EmptyState>
          )}
        </Panel>
      )}
      {!loading && products.length > 0 && (
        <Panel
          className="section-gap"
          title="Existing product documents"
          copy="Open a record to review its evidence and add updated files."
        >
          <div className="product-list">
            {products.map((product) => (
              <div className="decision-row" key={product.id}>
                <div>
                  <strong>{product.product_name}</strong>
                  <span>{product.documents.length} documents attached</span>
                </div>
                <Link
                  className="text-btn"
                  href={`/admin/batches/${context.batchId}/products/${product.id}?tab=documents`}
                >
                  Open documents <Icon name="arrow-right" />
                </Link>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {confirm.length > 0 && (
        <Modal
          title={`Attach ${confirm.length} document${
            confirm.length === 1 ? "" : "s"
          }?`}
          onClose={() => !busy && setConfirm([])}
        >
          <p>
            Check these destinations. Files are added to their records and
            earlier PDFs are retained.
          </p>
          {confirm.some(
            (id) =>
              products.find(
                (product) =>
                  product.id === queue.find((row) => row.id === id)?.productId
              )?.status === "published"
          ) && (
            <Notice title="Some destinations are already published" tone="warn">
              Their new documents will be immediately available to customers.
            </Notice>
          )}
          <ul className="review-list">
            {confirm.map((id) => {
              const row = queue.find((item) => item.id === id)!;
              return (
                <li key={id}>
                  <strong>{row.file.name}</strong> →{" "}
                  {
                    products.find((product) => product.id === row.productId)
                      ?.product_name
                  }{" "}
                  · {row.kind && DOCUMENT_LABELS[row.kind]}
                </li>
              );
            })}
          </ul>
          <div className="modal-actions">
            <Action onClick={() => setConfirm([])}>Keep reviewing</Action>
            <Action tone="primary" onClick={() => attach(confirm)}>
              Confirm attachments
            </Action>
          </div>
        </Modal>
      )}
    </>
  );
}
