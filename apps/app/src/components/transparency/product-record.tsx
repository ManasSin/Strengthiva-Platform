"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type {
  ProductDetail,
  ProductUpdate,
} from "@strengthiva/transparency/types";
import {
  formatDate,
  outcome,
  productValues,
  QA_FIELDS,
} from "@strengthiva/transparency/domain";
import {
  Icon,
  Loading,
  Notice,
  PageHead,
  Panel,
  QualityStatus,
} from "@strengthiva/transparency/ui";
import { transparencyApi } from "@/lib/transparency-api";
import { useResource } from "./use-resource";
import {
  Action,
  Breadcrumbs,
  ErrorNotice,
  Modal,
  useActiveRail,
} from "./controls";
import { PublicationStatus } from "./batches";
import { useAdminIdentity } from "./shell";
import { QrDownload, QrImage, QrSheet } from "./qr";
import {
  ProductDocuments,
  ProductIngredients,
  ProductPreview,
  PublicationChecklist,
} from "./product-sections";
const tabs = [
  ["overview", "Overview"],
  ["quality", "Quality checks"],
  ["ingredients", "Ingredients"],
  ["documents", "Documents"],
  ["publication", "Publication"],
  ["preview", "Customer preview"],
];
export function ProductRecordPage({
  batchId,
  id,
}: {
  batchId: string;
  id: string;
}) {
  const resource = useResource(`product-${id}`, (signal) =>
    transparencyApi.product(id, signal)
  );
  if (resource.loading) return <Loading />;
  if (resource.error || !resource.data)
    return (
      <ErrorNotice
        error={resource.error || new Error("Product record not found.")}
        retry={resource.reload}
      />
    );
  if (resource.data.batch_id !== batchId)
    return (
      <ErrorNotice
        error={new Error("This product does not belong to this batch.")}
      />
    );
  return <ProductEditor initial={resource.data} key={id} />;
}
function ProductEditor({ initial }: { initial: ProductDetail }) {
  const params = useSearchParams();
  const activeTab = params.get("tab") || "overview";
  const tabRail = useActiveRail<HTMLElement>(activeTab);
  const [product, setProduct] = useState(initial);
  const [values, setValues] = useState<ProductUpdate>(productValues(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState<
    "save" | "publish" | "unpublish" | "qr" | null
  >(null);
  const identity = useAdminIdentity();
  const dirty =
    JSON.stringify(values) !== JSON.stringify(productValues(product));
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const href = `/admin/batches/${product.batch_id}/products/${product.id}`;
  const field = (key: keyof ProductUpdate, value: string) => {
    setValues((current) => ({ ...current, [key]: value || null }));
    setMessage("");
  };
  async function perform(action: "save" | "publish" | "unpublish") {
    setBusy(true);
    setError(undefined);
    setMessage("");
    try {
      const updated =
        action === "save"
          ? await transparencyApi.updateProduct(product.id, values)
          : action === "publish"
          ? await transparencyApi.publish(product.id, identity)
          : await transparencyApi.unpublish(product.id);
      setProduct(updated);
      setValues(productValues(updated));
      setModal(null);
      setMessage(
        action === "save"
          ? "Product record saved."
          : action === "publish"
          ? "Product record published. Its QR page is now available."
          : "Record unpublished. Its QR page is no longer available."
      );
    } catch (error) {
      setError(error as Error);
    } finally {
      setBusy(false);
    }
  }
  function save() {
    if (
      values.manufacturing_date &&
      values.expiry_date &&
      values.expiry_date < values.manufacturing_date
    ) {
      setError(
        new Error("Expiry date must be on or after the manufacturing date.")
      );
      return;
    }
    if (product.status === "published") setModal("save");
    else void perform("save");
  }
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Batches", href: "/admin/batches" },
          {
            label: product.batch_number,
            href: `/admin/batches/${product.batch_id}`,
          },
          { label: product.product_name },
        ]}
      />
      <PageHead
        eyebrow="Batch product record"
        title={product.product_name}
        copy={`${product.batch_number} · One product, one batch, one QR code.`}
        actions={
          <>
            <PublicationStatus value={product.status} />
            <Action disabled={busy || !dirty} onClick={save}>
              {busy ? "Saving…" : "Save changes"}
            </Action>
            <Action
              tone="primary"
              disabled={busy || dirty || product.status === "published"}
              onClick={() => {
                setError(undefined);
                setModal("publish");
              }}
            >
              Review publication
            </Action>
          </>
        }
      />
      {product.status === "published" && (
        <Notice title="This record is live" tone="warn">
          Saved changes appear on the customer page immediately. Review changes
          before saving.
        </Notice>
      )}
      {dirty && (
        <Notice title="You have unsaved changes" tone="info">
          Save your dates and quality results before reviewing publication or
          leaving this record.
        </Notice>
      )}
      {message && (
        <div role="status">
          <Notice title={message} tone="good" />
        </div>
      )}
      {error && !modal && <ErrorNotice error={error} />}
      <nav ref={tabRail} className="tabs" aria-label="Product record sections">
        {tabs.map(([key, label]) => (
          <Link
            scroll={false}
            className={`tab ${activeTab === key ? "active" : ""}`}
            aria-current={activeTab === key ? "page" : undefined}
            key={key}
            href={`${href}?tab=${key}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className={activeTab === "preview" ? "" : "record-layout"}>
        <div className="section-stack">
          {activeTab === "overview" && (
            <>
              <Panel
                title="Record identity"
                copy="Core dates and identifiers for this product."
              >
                <div className="form-grid">
                  {[
                    ["received_date", "Received date"],
                    ["manufacturing_date", "Manufacturing date"],
                    ["expiry_date", "Expiry date"],
                  ].map(([key, label]) => (
                    <label className="field" key={key}>
                      <span>{label}</span>
                      <input
                        className="input"
                        type="date"
                        value={values[key as keyof ProductUpdate] || ""}
                        disabled={busy}
                        onChange={(event) =>
                          field(key as keyof ProductUpdate, event.target.value)
                        }
                      />
                      <span className="help">
                        {key === "received_date"
                          ? "Optional"
                          : "Required before publishing"}
                      </span>
                    </label>
                  ))}
                  <label className="field">
                    <span>Batch number</span>
                    <input
                      className="input mono"
                      readOnly
                      value={product.batch_number}
                    />
                  </label>
                </div>
              </Panel>
              <Panel
                title="Record readiness"
                copy="The evidence currently attached to this record."
              >
                <div className="stats">
                  <div className="stat">
                    <strong>{product.ingredients.length}</strong>
                    <span>Ingredients</span>
                  </div>
                  <div className="stat">
                    <strong>
                      {QA_FIELDS.filter(([key]) => !!product[key]).length}/5
                    </strong>
                    <span>Recorded checks</span>
                  </div>
                  <div className="stat">
                    <strong>{product.documents.length}</strong>
                    <span>Documents</span>
                  </div>
                  <div className="stat">
                    <strong>{product.blockers.length}</strong>
                    <span>Publishing blockers</span>
                  </div>
                </div>
              </Panel>
            </>
          )}
          {activeTab === "quality" && (
            <Panel
              title="Quality checks"
              copy="Record the result exactly as reviewed. A blank or unrecognised result is never shown as a pass."
            >
              <div className="qa-edit-list">
                {QA_FIELDS.map(([key, label]) => (
                  <label className="qa-edit-row" key={key}>
                    <span>{label}</span>
                    <input
                      className="input"
                      list="qa-results"
                      value={values[key] || ""}
                      disabled={busy}
                      placeholder="Not recorded"
                      onChange={(event) => field(key, event.target.value)}
                    />
                    <QualityStatus value={outcome(values[key])} />
                  </label>
                ))}
              </div>
              <datalist id="qa-results">
                <option value="Passed" />
                <option value="Failed" />
                <option value="Verified" />
                <option value="Approved" />
              </datalist>
              <div className="scope-note">
                <Icon name="file" />
                <span>
                  Upload laboratory evidence in Documents. Numerical limits and
                  measured values are not separate fields in the current record.
                </span>
              </div>
              <div className="form-actions">
                <Action tone="primary" disabled={!dirty || busy} onClick={save}>
                  Save quality results
                </Action>
              </div>
            </Panel>
          )}
          {activeTab === "ingredients" && (
            <ProductIngredients product={product} />
          )}
          {activeTab === "documents" && (
            <ProductDocuments product={product} onChange={setProduct} />
          )}
          {activeTab === "publication" && (
            <Panel
              title="Publication"
              copy="Required checks and missing evidence are reviewed before this record becomes public."
            >
              <PublicationChecklist product={product} href={href} />
              <div className="form-actions">
                <Action
                  tone="primary"
                  disabled={dirty || busy || product.status === "published"}
                  onClick={() => setModal("publish")}
                >
                  Review before publishing
                </Action>
              </div>
            </Panel>
          )}
          {activeTab === "preview" && <ProductPreview product={product} />}
          {!tabs.some(([key]) => key === activeTab) && (
            <Notice title="Choose a section above" tone="info">
              This record section does not exist.
            </Notice>
          )}
        </div>
        {activeTab !== "preview" && (
          <aside className="record-aside">
            <Panel title="QR code" copy="One product · one batch">
              <QrImage id={product.id} name={product.product_name} />
              <div className="cluster center">
                <QrDownload id={product.id} name={product.product_name} />
                <Action onClick={() => setModal("qr")}>
                  <Icon name="printer" />
                  Print
                </Action>
              </div>
              <p className="tiny muted qr-caption">
                {product.status === "draft"
                  ? "The code will resolve after publication."
                  : "This code opens the published record."}
              </p>
            </Panel>
            <Panel
              title="Customer preview"
              copy={
                product.status === "published"
                  ? "Current published view"
                  : "Private draft preview"
              }
            >
              <div className="preview-mini">
                <strong>{product.product_name}</strong>
                <dl>
                  <div>
                    <dt>Batch</dt>
                    <dd className="mono">{product.batch_number}</dd>
                  </div>
                  <div>
                    <dt>Expiry</dt>
                    <dd>{formatDate(product.expiry_date)}</dd>
                  </div>
                </dl>
              </div>
              <Link
                className="btn btn-secondary full-width"
                href={`${href}?tab=preview`}
              >
                Preview saved record <Icon name="eye" />
              </Link>
              {product.status === "published" && (
                <a
                  className="text-btn"
                  href={product.verify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open customer page <Icon name="external" />
                </a>
              )}
            </Panel>
            {product.status === "published" && (
              <Panel
                title="Live record"
                copy={`Published ${formatDate(product.published_at)}`}
              >
                <Action
                  tone="danger"
                  disabled={dirty || busy}
                  onClick={() => setModal("unpublish")}
                >
                  Unpublish record
                </Action>
              </Panel>
            )}
          </aside>
        )}
      </div>
      {modal && modal !== "qr" && (
        <Modal
          title={
            modal === "save"
              ? "Save changes to a live record?"
              : modal === "unpublish"
              ? "Unpublish this record?"
              : product.blockers.length
              ? "Publishing is blocked"
              : "Publish this product record?"
          }
          onClose={() => !busy && setModal(null)}
        >
          {modal === "publish" ? (
            <>
              <p>
                Publishing makes this saved record accessible to anyone with its
                QR code.
              </p>
              <PublicationChecklist
                product={product}
                href={href}
                onNavigate={() => setModal(null)}
              />
            </>
          ) : (
            <p>
              {modal === "save"
                ? "Customers scanning this product’s QR code will see the saved changes immediately."
                : "The QR page will stop showing this record until it is published again."}
            </p>
          )}
          {error && <ErrorNotice error={error} />}
          <div className="modal-actions">
            <Action disabled={busy} onClick={() => setModal(null)}>
              {modal === "publish" && product.blockers.length
                ? "Keep reviewing"
                : "Cancel"}
            </Action>
            <Action
              tone={modal === "unpublish" ? "danger" : "primary"}
              disabled={
                busy || (modal === "publish" && product.blockers.length > 0)
              }
              onClick={() => perform(modal)}
            >
              {busy
                ? "Working…"
                : modal === "save"
                ? "Save live changes"
                : modal === "publish"
                ? "Publish record"
                : "Unpublish record"}
            </Action>
          </div>
        </Modal>
      )}
      {modal === "qr" && (
        <QrSheet
          products={[product]}
          batchNumber={product.batch_number}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
