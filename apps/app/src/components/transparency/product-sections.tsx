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
  quantity,
} from "@strengthiva/transparency/domain";
import {
  EmptyState,
  Icon,
  Loading,
  Notice,
  Panel,
  QualityStatus,
  Status,
} from "@strengthiva/transparency/ui";
import { PublicRecord } from "@strengthiva/transparency/public-record";
import { publicDocumentUrl, transparencyApi } from "@/lib/transparency-api";
import { Action, ErrorNotice, Modal } from "./controls";
import { useResource } from "./use-resource";

export function ProductIngredients({ product }: { product: ProductDetail }) {
  return (
    <Panel
      title="Ingredient traceability"
      copy={`${product.ingredients.length} rows in workbook order. Quality scores and source details are preserved per ingredient row.`}
      actions={
        <Link
          className="btn btn-secondary"
          href={`/admin/reports?batch=${product.batch_id}`}
        >
          Attach lab reports
        </Link>
      }
    >
      {product.ingredients.length ? (
        <div
          className="table-frame"
          role="region"
          aria-label="Ingredient traceability table"
          tabIndex={0}
        >
          <table className="table ingredients-table">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Quantity</th>
                <th>Internal score</th>
                <th>Source</th>
                <th>QC status</th>
                <th>Lab report</th>
              </tr>
            </thead>
            <tbody>
              {product.ingredients.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <span className="sub">
                      <em>
                        {row.botanical_name || "Botanical name not recorded"}
                      </em>
                    </span>
                  </td>
                  <td className="mono">
                    {quantity(row.qty_value, row.qty_unit)}
                  </td>
                  <td className="mono">
                    {row.quality_score === null
                      ? "—"
                      : `${row.quality_score} / 100`}
                  </td>
                  <td>{row.source_location || "Not recorded"}</td>
                  <td>
                    <QualityStatus value={outcome(row.qc_status)} />
                    {row.qc_status && outcome(row.qc_status) === null && (
                      <span className="sub">{row.qc_status}</span>
                    )}
                  </td>
                  <td>
                    {row.lab_report_id ? (
                      <>
                        {product.status === "published" ? (
                          <a
                            className="text-btn"
                            href={publicDocumentUrl(
                              product.id,
                              row.lab_report_id
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View PDF <Icon name="external" />
                          </a>
                        ) : (
                          <Status tone="good" icon="check">
                            Attached
                          </Status>
                        )}
                      </>
                    ) : (
                      <Link
                        className="text-btn"
                        href={`/admin/reports?batch=${product.batch_id}`}
                      >
                        Attach report
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No ingredients recorded">
          Review the source workbook before this product is published.
        </EmptyState>
      )}
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
    </Panel>
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
  async function upload(file: File, kind: DocumentKind) {
    setBusy(true);
    setError(undefined);
    try {
      await transparencyApi.upload(product.id, file, kind);
      onChange(await transparencyApi.product(product.id));
      setPending(undefined);
      setMessage("Document attached successfully.");
    } catch (error) {
      setError(error as Error);
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
    else void upload(file, kind);
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
          Adding an updated PDF keeps earlier attachments. Saved documents can
          be viewed through the customer page after publication.
        </span>
      </div>
      {pending && (
        <Modal
          title="Attach a document to a live record?"
          onClose={() => !busy && setPending(undefined)}
        >
          <p>
            {pending.file.name} will be added to the public downloads for{" "}
            {product.product_name}.
          </p>
          {error && <ErrorNotice error={error} />}
          <div className="modal-actions">
            <Action disabled={busy} onClick={() => setPending(undefined)}>
              Cancel
            </Action>
            <Action
              tone="primary"
              disabled={busy}
              onClick={() => upload(pending.file, pending.kind)}
            >
              {busy ? "Uploading…" : "Attach to live record"}
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
