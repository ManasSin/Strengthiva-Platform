"use client";
import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@strengthiva/transparency/domain";
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
import { useResource } from "./use-resource";
import { Action, Breadcrumbs, ErrorNotice, Modal } from "./controls";
import { PublicationStatus } from "./batches";
import { useAdminIdentity } from "./shell";
import { QrSheet } from "./qr";
export function BatchDetailPage({ id }: { id: string }) {
  const resource = useResource(`batch-${id}`, (signal) =>
    transparencyApi.batch(id, signal)
  );
  const identity = useAdminIdentity();
  const [confirm, setConfirm] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  const [message, setMessage] = useState("");
  if (resource.loading) return <Loading />;
  if (resource.error || !resource.data)
    return (
      <ErrorNotice
        error={resource.error || new Error("Batch not found.")}
        retry={resource.reload}
      />
    );
  const batch = resource.data;
  const ready = batch.products.filter(
    (product) => product.status === "draft" && !product.blockers.length
  );
  const blocked = batch.products.filter((product) => product.blockers.length);
  async function publish() {
    setBusy(true);
    setError(undefined);
    let count = 0;
    try {
      for (const product of ready) {
        await transparencyApi.publish(product.id, identity);
        count++;
      }
      setMessage(`${count} product record${count === 1 ? "" : "s"} published.`);
      setConfirm(false);
      resource.reload();
    } catch (error) {
      setError(
        error instanceof Error ? error : new Error("Publication failed.")
      );
      setMessage(
        `${count} records published before the request stopped. Refresh to review the remaining drafts.`
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Batches", href: "/admin/batches" },
          { label: batch.batch_number },
        ]}
      />
      <PageHead
        eyebrow="Manufacturing order"
        title={batch.batch_number}
        copy={`${batch.po_number || "No PO recorded"} · Ordered ${formatDate(
          batch.order_date
        )}`}
        actions={
          <>
            <Action
              disabled={!batch.products.length}
              onClick={() => setSheet(true)}
            >
              <Icon name="printer" />
              QR print sheet
            </Action>
            <Action
              tone="primary"
              disabled={!ready.length}
              onClick={() => {
                setError(undefined);
                setConfirm(true);
              }}
            >
              <Icon name="check" />
              Publish ready products
            </Action>
          </>
        }
      />
      {message && <Notice title={message} tone="info" />}
      <div className="split">
        <div className="section-stack">
          <Panel
            title="Products in this batch"
            copy="Each product has its own record and QR code."
          >
            {batch.products.length ? (
              <div className="product-list">
                {batch.products.map((product) => (
                  <article className="batch-product" key={product.id}>
                    <div className="batch-product-main">
                      <div>
                        <Link
                          className="product-name"
                          href={`/admin/batches/${id}/products/${product.id}`}
                        >
                          {product.product_name}
                        </Link>
                        <span className="small muted">
                          {product.ingredient_count} ingredients · Expires{" "}
                          {formatDate(product.expiry_date)}
                        </span>
                      </div>
                      <PublicationStatus value={product.status} />
                    </div>
                    <div className="completeness-row">
                      <span>
                        <Icon name="leaf" />
                        {product.ingredient_count} ingredients
                      </span>
                      <span>
                        <Icon name="file" />
                        {product.document_count} documents
                      </span>
                      <Status
                        tone={product.blockers.length ? "warn" : "good"}
                        icon={product.blockers.length ? "alert" : "check"}
                      >
                        {product.blockers.length
                          ? `${product.blockers.length} to resolve`
                          : "Ready to publish"}
                      </Status>
                      <Link
                        className="text-btn"
                        href={`/admin/batches/${id}/products/${product.id}`}
                      >
                        Review record <Icon name="arrow-right" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No product records">
                This manufacturing order has no transparency records yet.
              </EmptyState>
            )}
          </Panel>
        </div>
        <aside className="section-stack">
          <Panel
            title="Batch readiness"
            copy="Publication is reviewed separately for each product."
          >
            <div className="readiness-count">
              <strong>
                {batch.products.filter((p) => p.status === "published").length}
                <span> / {batch.products.length}</span>
              </strong>
              <p>product records published</p>
            </div>
            <div className="scope-note">
              <Icon name="lock" />
              <span>
                Every QR opens one product from this batch. Other products stay
                separate.
              </span>
            </div>
          </Panel>
          <Panel title="Next actions">
            <div className="section-stack">
              <Link
                className="btn btn-secondary"
                href={`/admin/documents?batch=${id}`}
              >
                <Icon name="upload" />
                Upload batch documents
              </Link>
              <Link
                className="btn btn-secondary"
                href={`/admin/reports?batch=${id}`}
              >
                <Icon name="flask" />
                Review lab reports
              </Link>
            </div>
          </Panel>
          {blocked.length > 0 && (
            <Panel title="Needs attention">
              {blocked.map((product) => (
                <Link
                  className="check-item"
                  key={product.id}
                  href={`/admin/batches/${id}/products/${product.id}?tab=publication`}
                >
                  <Icon name="alert" />
                  <div>
                    <strong>{product.product_name}</strong>
                    <p>{product.blockers.join(" ")}</p>
                  </div>
                  <Icon name="arrow-right" />
                </Link>
              ))}
            </Panel>
          )}
        </aside>
      </div>
      {confirm && (
        <Modal
          title={`Publish ${ready.length} product records?`}
          onClose={() => !busy && setConfirm(false)}
        >
          <p>
            These products meet the required date and ingredient checks. Missing
            quality results or documents will remain visible as missing on their
            customer pages.
          </p>
          <ul className="review-list">
            {ready.map((product) => (
              <li key={product.id}>{product.product_name}</li>
            ))}
          </ul>
          {error && <ErrorNotice error={error} />}
          <div className="modal-actions">
            <Action disabled={busy} onClick={() => setConfirm(false)}>
              Cancel
            </Action>
            <Action tone="primary" disabled={busy} onClick={publish}>
              {busy ? "Publishing…" : "Publish records"}
            </Action>
          </div>
        </Modal>
      )}
      {sheet && (
        <QrSheet
          products={batch.products}
          batchNumber={batch.batch_number}
          onClose={() => setSheet(false)}
        />
      )}
    </>
  );
}
