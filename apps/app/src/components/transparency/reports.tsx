"use client";
import { useState } from "react";
import Link from "next/link";
import { quantity } from "@strengthiva/transparency/domain";
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
import { Action, ErrorNotice, Modal } from "./controls";
import { BatchPicker, useBatchRecords } from "./batch-records";
export function ReportsPage() {
  const context = useBatchRecords();
  const [search, setSearch] = useState("");
  const [missing, setMissing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [file, setFile] = useState<File>();
  const [existing, setExisting] = useState("");
  const [uploadedId, setUploadedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<Error>();
  const [message, setMessage] = useState("");
  const products = context.records.data || [];
  const rows = products.flatMap((product) =>
    product.ingredients.map((row) => ({
      ...row,
      productId: product.id,
      productName: product.product_name,
      published: product.status === "published",
    }))
  );
  const shown = rows.filter(
    (row) =>
      (!missing || !row.lab_report_id) &&
      `${row.name} ${row.productName} ${row.botanical_name || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );
  const reports = Array.from(
    new Set(
      rows.flatMap((row) => (row.lab_report_id ? [row.lab_report_id] : []))
    )
  );
  function resetSelection(id: string) {
    context.setBatchId(id);
    setSelected([]);
    setFile(undefined);
    setExisting("");
    setUploadedId("");
    setMessage("");
  }
  async function attach() {
    const first = rows.find((row) => selected.includes(row.id));
    if (!first) return;
    setBusy(true);
    setError(undefined);
    setMessage("");
    try {
      let documentId = existing || uploadedId;
      if (!documentId && file) {
        documentId = (
          await transparencyApi.upload(first.productId, file, "lab_report")
        ).id;
        setUploadedId(documentId);
      }
      if (!documentId) throw new Error("Choose a lab report first.");
      await transparencyApi.attach(documentId, selected);
      setMessage(`One report attached to ${selected.length} ingredient rows.`);
      setConfirm(false);
      setSelected([]);
      setFile(undefined);
      setExisting("");
      setUploadedId("");
      context.records.reload();
    } catch (error) {
      setError(error as Error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHead
        eyebrow="Shared laboratory evidence"
        title="Lab reports"
        copy="Upload once and explicitly choose the ingredient rows a report covers. Each row keeps its own quality score and source."
      />
      <Panel>
        <BatchPicker
          batchId={context.batchId}
          batches={context.batches.data || []}
          disabled={busy || !!uploadedId}
          onChange={resetSelection}
        />
      </Panel>
      <div className="section-gap">
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
        {message && (
          <div role="status">
            <Notice title={message} tone="good" />
          </div>
        )}
        {error && !confirm && <ErrorNotice error={error} />}
      </div>
      {context.batches.loading || context.records.loading ? (
        <Loading />
      ) : !rows.length ? (
        <Panel>
          <EmptyState
            title="No ingredient rows to attach to"
            action={
              <Link className="btn btn-primary" href="/admin/import">
                Import workbook
              </Link>
            }
          >
            Choose a batch with product ingredients to begin.
          </EmptyState>
        </Panel>
      ) : (
        <div className="split">
          <Panel
            title="Choose ingredient rows"
            copy={`${
              rows.filter((row) => !row.lab_report_id).length
            } rows are missing a report.`}
          >
            <div className="toolbar">
              <label className="search">
                <Icon name="search" />
                <input
                  className="input"
                  aria-label="Search ingredient rows"
                  placeholder="Search ingredient or product"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="cluster small">
                <input
                  type="checkbox"
                  checked={missing}
                  onChange={(event) => setMissing(event.target.checked)}
                />
                Missing reports only
              </label>
            </div>
            <div className="toolbar">
              <Action
                disabled={busy || !shown.length}
                onClick={() =>
                  setSelected(
                    Array.from(
                      new Set([...selected, ...shown.map((row) => row.id)])
                    )
                  )
                }
              >
                Select shown rows
              </Action>
              <Action
                disabled={busy || !selected.length}
                onClick={() => setSelected([])}
              >
                Clear selection
              </Action>
              <Status tone="info">{selected.length} selected</Status>
            </div>
            <div className="report-selection">
              {shown.map((row) => (
                <label className="checkbox-row" key={row.id}>
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={selected.includes(row.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, row.id]
                          : current.filter((id) => id !== row.id)
                      )
                    }
                  />
                  <div>
                    <strong>{row.name}</strong>
                    <span>
                      {row.productName} ·{" "}
                      {quantity(row.qty_value, row.qty_unit)}
                    </span>
                    <span>
                      Source: {row.source_location || "Not recorded"} · Score:{" "}
                      {row.quality_score ?? "Not recorded"}
                    </span>
                  </div>
                  <Status
                    tone={row.lab_report_id ? "good" : "warn"}
                    icon={row.lab_report_id ? "check" : "alert"}
                  >
                    {row.lab_report_id ? "Attached" : "Missing"}
                  </Status>
                </label>
              ))}
              {!shown.length && (
                <EmptyState title="No matching rows">
                  Try another search or turn off the missing-report filter.
                </EmptyState>
              )}
            </div>
          </Panel>
          <aside className="section-stack">
            <Panel
              title="Report to attach"
              copy="Use a PDF already attached in this batch, or upload a new one."
            >
              <label className="field">
                <span>Existing report</span>
                <select
                  className="select"
                  value={existing}
                  disabled={busy || !!uploadedId}
                  onChange={(event) => {
                    setExisting(event.target.value);
                    setFile(undefined);
                  }}
                >
                  <option value="">Upload a new report</option>
                  {reports.map((id) => (
                    <option value={id} key={id}>
                      {rows.find((row) => row.lab_report_id === id)?.name} ·{" "}
                      {id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </label>
              {!existing && (
                <label className="field section-gap">
                  <span>Lab report PDF</span>
                  <input
                    className="input"
                    type="file"
                    accept=".pdf,application/pdf"
                    disabled={busy || !!uploadedId}
                    onChange={(event) => {
                      const chosen = event.target.files?.[0];
                      if (chosen && !/\.pdf$/i.test(chosen.name)) {
                        setError(new Error("Choose a PDF lab report."));
                        return;
                      }
                      setFile(chosen);
                      setError(undefined);
                    }}
                  />
                </label>
              )}
              {file && <p className="small muted section-gap">{file.name}</p>}
              {uploadedId && (
                <Notice
                  title="PDF uploaded; attachment can be retried"
                  tone="info"
                >
                  The uploaded file is retained while you retry attaching it.
                </Notice>
              )}
              <div className="form-actions">
                <Action
                  tone="primary"
                  disabled={
                    busy ||
                    !selected.length ||
                    (!existing && !file && !uploadedId)
                  }
                  onClick={() => setConfirm(true)}
                >
                  <Icon name="check" />
                  Review attachment
                </Action>
              </div>
            </Panel>
            <Notice title="Choose only rows covered by this report" tone="warn">
              A matching ingredient name does not establish a shared
              consignment. Select the actual rows supported by the laboratory
              evidence.
            </Notice>
            <Panel title="Reports in this batch">
              {reports.length ? (
                reports.map((id) => (
                  <div className="decision-row" key={id}>
                    <div>
                      <strong>Report {id.slice(0, 8)}</strong>
                      <span>
                        Used in{" "}
                        {
                          new Set(
                            rows
                              .filter((row) => row.lab_report_id === id)
                              .map((row) => row.productId)
                          ).size
                        }{" "}
                        products ·{" "}
                        {rows.filter((row) => row.lab_report_id === id).length}{" "}
                        ingredient rows
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">No lab reports attached yet.</p>
              )}
            </Panel>
          </aside>
        </div>
      )}
      {confirm && (
        <Modal
          title={`Attach one report to ${selected.length} rows?`}
          onClose={() => !busy && setConfirm(false)}
        >
          <p>
            Only the selected ingredient rows will be updated. Their individual
            source and quality values will be preserved.
          </p>
          {rows.some((row) => selected.includes(row.id) && row.published) && (
            <Notice title="Some rows belong to published records" tone="warn">
              The report links on their customer pages will change immediately.
            </Notice>
          )}
          {rows.some(
            (row) => selected.includes(row.id) && row.lab_report_id
          ) && (
            <Notice title="Existing report links will be replaced" tone="warn">
              Previously uploaded files are retained, but these rows will
              reference the selected report.
            </Notice>
          )}
          <ul className="review-list">
            {rows
              .filter((row) => selected.includes(row.id))
              .map((row) => (
                <li key={row.id}>
                  {row.name} · {row.productName}
                </li>
              ))}
          </ul>
          {error && <ErrorNotice error={error} />}
          <div className="modal-actions">
            <Action disabled={busy} onClick={() => setConfirm(false)}>
              Keep reviewing
            </Action>
            <Action tone="primary" disabled={busy} onClick={attach}>
              {busy ? "Attaching…" : "Confirm attachment"}
            </Action>
          </div>
        </Modal>
      )}
    </>
  );
}
