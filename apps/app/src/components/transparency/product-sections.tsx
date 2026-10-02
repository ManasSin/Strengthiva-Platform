"use client";
import { useState } from "react";
import Link from "next/link";
import type {
  DocumentKind,
  ProductDetail,
  PublicRecord as PublicData,
} from "@strengthiva/transparency/types";
import {
  DOCUMENT_LABELS,
  DOCUMENT_SLOTS,
  formatDate,
  outcome,
  QA_FIELDS,
} from "@strengthiva/transparency/domain";
import {
  Icon,
  Loading,
  Notice,
  Panel,
  Status,
} from "@strengthiva/transparency/ui";
import { PublicRecord } from "@strengthiva/transparency/public-record";
import { publicDocumentUrl, transparencyApi } from "@/lib/transparency-api";
import { Action, ErrorNotice, Modal } from "./controls";
import { IngredientEditor } from "./ingredient-editor";
import { useResource } from "./use-resource";

/**
 * The ingredient section. The table itself lives in IngredientEditor, which is
 * large enough on its own now that rows are editable; this keeps the section's
 * footer note beside it and the import path unchanged for the record page.
 */
export function ProductIngredients({
  product,
  onChange,
  onDirtyChange,
}: {
  product: ProductDetail;
  onChange: (product: ProductDetail) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  return (
    <>
      <IngredientEditor
        product={product}
        onChange={onChange}
        onDirtyChange={onDirtyChange}
      />
      <div className="scope-note">
        <Icon name="leaf" />
        <span>
          Botanical names can be reviewed in the{" "}
          <Link className="text-btn" href="/admin/ingredients">
            ingredient library
          </Link>
          . Scores are internal quality indicators, not regulatory ratings.
        </span>
      </div>
    </>
  );
}
export function PublicationChecklist({
  product,
  href,
  onNavigate,
}: {
  product: ProductDetail;
  href: string;
  onNavigate?: () => void;
}) {
  const target = (message: string) =>
    /ingredient/i.test(message) ? "ingredients" : "overview";
  return (
    <div className="publication-checklist">
      <div className="panel-title">
        <h3>Required before publishing</h3>
        <Status
          tone={product.blockers.length ? "warn" : "good"}
          icon={product.blockers.length ? "alert" : "check"}
        >
          {product.blockers.length
            ? `${product.blockers.length} blockers`
            : "Ready"}
        </Status>
      </div>
      {product.blockers.length ? (
        product.blockers.map((blocker) => (
          <div className="check-item" key={blocker}>
            <Icon name="alert" />
            <div>
              <strong>{blocker}</strong>
              <p>This must be resolved before publishing.</p>
            </div>
            <Link
              className="text-btn"
              href={`${href}?tab=${target(blocker)}`}
              onClick={onNavigate}
            >
              Resolve <Icon name="arrow-right" />
            </Link>
          </div>
        ))
      ) : (
        <div className="check-item">
          <Icon name="check" />
          <div>
            <strong>Required dates and ingredients are present</strong>
            <p>The expiry date is on or after manufacturing.</p>
          </div>
        </div>
      )}
      <h3 className="checklist-subheading">Evidence to review</h3>
      {product.warnings.length ? (
        product.warnings.map((warning) => (
          <div className="check-item" key={warning}>
            <Icon name="alert" />
            <div>
              <strong>{warning}</strong>
              <p>Warning · does not block publication.</p>
            </div>
            <Link
              className="text-btn"
              href={`${href}?tab=${
                /document/i.test(warning) ? "documents" : "quality"
              }`}
              onClick={onNavigate}
            >
              Review
            </Link>
          </div>
        ))
      ) : (
        <div className="check-item">
          <Icon name="check" />
          <div>
            <strong>No evidence warnings</strong>
            <p>Review the saved results and files before you publish.</p>
          </div>
        </div>
      )}
      <div className="scope-note">
        <Icon name="lock" />
        <span>
          “Verified batch record” means this record was published by
          Strengthiva. It does not authenticate an individual bottle.
        </span>
      </div>
    </div>
  );
}
export function ProductDocuments({
  product,
  onChange,
}: {
  product: ProductDetail;
  onChange: (product: ProductDetail) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  const [pending, setPending] = useState<{ file: File; kind: DocumentKind }>();
  const [message, setMessage] = useState("");
  const [removing, setRemoving] = useState<{ id: string; name: string }>();
  /**
   * The document a newly chosen file should replace. Replacing is upload-then-
   * delete rather than a dedicated endpoint, and in that order on purpose: if the
   * upload fails the old file is still there, which is the safer way to fail.
   */
  const [replacing, setReplacing] = useState<string | null>(null);

  async function upload(
    file: File,
    kind: DocumentKind,
    replaceId?: string | null
  ) {
    setBusy(true);
    setError(undefined);
    try {
      await transparencyApi.upload(product.id, file, kind);
      if (replaceId) await transparencyApi.deleteDocument(replaceId);
      onChange(await transparencyApi.product(product.id));
      setPending(undefined);
      setReplacing(null);
      setMessage(
        replaceId ? "Document replaced." : "Document attached successfully."
      );
    } catch (error) {
      setError(error as Error);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(undefined);
    try {
      await transparencyApi.deleteDocument(id);
      onChange(await transparencyApi.product(product.id));
      setRemoving(undefined);
      setMessage("Document removed.");
    } catch (error) {
      setError(error as Error);
      setRemoving(undefined);
    } finally {
      setBusy(false);
    }
  }

  function choose(file: File | undefined, kind: DocumentKind) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name)) {
      setError(new Error("Only PDF documents are accepted."));
      return;
    }
    if (product.status === "published") setPending({ file, kind });
    else void upload(file, kind, replacing);
  }
  return (
    <Panel
      title="Product documents"
      copy="Upload PDFs into the right evidence category."
      actions={
        <Link
          className="btn btn-secondary"
          href={`/admin/documents?batch=${product.batch_id}`}
        >
          Open bulk matching
        </Link>
      }
    >
      {error && !pending && <ErrorNotice error={error} />}
      {message && (
        <div role="status">
          <Notice title={message} tone="good" />
        </div>
      )}
      <div className="document-grid">
        {DOCUMENT_SLOTS.map((kind) => {
          const documents = product.documents.filter(
            (doc) => doc.kind === kind
          );
          return (
            <article
              className={`document-slot ${!documents.length ? "empty" : ""}`}
              key={kind}
            >
              <strong>{DOCUMENT_LABELS[kind]}</strong>
              {documents.length ? (
                documents.map((doc) => (
                  <div className="document-version" key={doc.id}>
                    <p>{doc.original_filename}</p>
                    <span className="tiny muted">
                      Added {formatDate(doc.created_at)}
                    </span>
                    {product.status === "published" && (
                      <a
                        className="text-btn"
                        href={publicDocumentUrl(product.id, doc.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View / download <Icon name="external" />
                      </a>
                    )}
                    {/* Replace reuses the slot's own file input: marking which
                        document is being replaced, then opening the picker, keeps
                        one upload path instead of a second parallel one. */}
                    <div className="document-actions">
                      <label className="text-btn">
                        Replace file
                        <input
                          type="file"
                          accept="application/pdf"
                          hidden
                          disabled={busy}
                          onClick={() => setReplacing(doc.id)}
                          onChange={(event) => {
                            choose(event.target.files?.[0], kind);
                            event.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="text-btn danger"
                        disabled={busy}
                        onClick={() =>
                          setRemoving({
                            id: doc.id,
                            name: doc.original_filename,
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No PDF attached yet.</p>
              )}
              <Status
                tone={documents.length ? "good" : "warn"}
                icon={documents.length ? "check" : "alert"}
              >
                {documents.length ? "Attached" : "Missing"}
              </Status>
              <label className="upload-label">
                <span>
                  {busy
                    ? "Uploading…"
                    : documents.length
                    ? "Add updated PDF"
                    : "Upload PDF"}
                </span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  disabled={busy}
                  aria-label={`Upload ${DOCUMENT_LABELS[kind]}`}
                  onChange={(event) => {
                    choose(event.target.files?.[0], kind);
                    event.target.value = "";
                  }}
                />
              </label>
            </article>
          );
        })}
      </div>
      <div className="scope-note">
        <Icon name="file" />
        <span>
          “Add updated PDF” keeps the earlier file alongside the new one; use
          “Replace file” to swap it. Saved documents can be viewed through the
          customer page after publication.
        </span>
      </div>
      {pending && (
        <Modal
          title={
            replacing
              ? "Replace a document on a live record?"
              : "Attach a document to a live record?"
          }
          onClose={() => {
            if (busy) return;
            setPending(undefined);
            setReplacing(null);
          }}
        >
          <p>
            {replacing
              ? `${pending.file.name} will replace the current file in the public downloads for ${product.product_name}. The file it replaces is deleted.`
              : `${pending.file.name} will be added to the public downloads for ${product.product_name}.`}
          </p>
          {error && <ErrorNotice error={error} />}
          <div className="modal-actions">
            <Action
              disabled={busy}
              onClick={() => {
                setPending(undefined);
                setReplacing(null);
              }}
            >
              Cancel
            </Action>
            <Action
              tone="primary"
              disabled={busy}
              onClick={() => upload(pending.file, pending.kind, replacing)}
            >
              {busy
                ? "Uploading…"
                : replacing
                ? "Replace on live record"
                : "Attach to live record"}
            </Action>
          </div>
        </Modal>
      )}
      {removing && (
        <Modal
          title="Remove this document?"
          onClose={() => !busy && setRemoving(undefined)}
        >
          <p>
            {removing.name} will be deleted, and any ingredient row using it as a
            lab report will show no report.
            {product.status === "published" &&
              " It disappears from the customer page immediately."}
          </p>
          <p className="tiny muted">
            The file itself is deleted and cannot be recovered. Upload it again
            if you need it back.
          </p>
          {error && <ErrorNotice error={error} />}
          <div className="modal-actions">
            <Action disabled={busy} onClick={() => setRemoving(undefined)}>
              Cancel
            </Action>
            <Action
              tone="danger"
              disabled={busy}
              onClick={() => remove(removing.id)}
            >
              {busy ? "Removing…" : "Remove document"}
            </Action>
          </div>
        </Modal>
      )}
    </Panel>
  );
}
export function ProductPreview({ product }: { product: ProductDetail }) {
  const [now] = useState(() => Date.now());
  const settings = useResource("preview-settings", (signal) =>
    transparencyApi.settings(signal)
  );
  if (settings.loading) return <Loading />;
  if (settings.error || !settings.data)
    return (
      <ErrorNotice
        error={settings.error || new Error("Company settings unavailable.")}
        retry={settings.reload}
      />
    );
  const expiry = product.expiry_date;
  const today = new Date(now).toISOString().slice(0, 10);
  const soon = new Date(now + 90 * 86400000).toISOString().slice(0, 10);
  const data: PublicData = {
    ...settings.data,
    id: product.id,
    product_name: product.product_name,
    batch_number: product.batch_number,
    manufacturing_date: product.manufacturing_date,
    expiry_date: expiry,
    expiry_state: !expiry
      ? null
      : expiry < today
      ? "expired"
      : expiry <= soon
      ? "expiring_soon"
      : "valid",
    quality_checks: QA_FIELDS.map(([key, label]) => ({
      label,
      outcome: outcome(product[key]),
      recorded: product[key],
    })),
    ingredients: product.ingredients.map((row) => ({
      ...row,
      lab_report_url:
        product.status === "published" && row.lab_report_id
          ? publicDocumentUrl(product.id, row.lab_report_id)
          : null,
    })),
    documents:
      product.status === "published"
        ? product.documents.map((doc) => ({
            id: doc.id,
            kind: doc.kind,
            filename: doc.original_filename,
            url: publicDocumentUrl(product.id, doc.id),
          }))
        : [],
  };
  return (
    <div className="customer-preview">
      <PublicRecord data={data} preview />
      {product.status === "draft" && product.documents.length > 0 && (
        <Notice
          title={`${product.documents.length} documents will be available after publication`}
          tone="info"
        >
          Document downloads are private while this record is a draft.
        </Notice>
      )}
    </div>
  );
}
