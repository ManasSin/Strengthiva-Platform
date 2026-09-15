"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  ImportPreview,
  ImportResult,
} from "@strengthiva/transparency/types";
import {
  Icon,
  Notice,
  PageHead,
  Panel,
  Status,
} from "@strengthiva/transparency/ui";
import { transparencyApi } from "@/lib/transparency-api";
import { Action, Dropzone, ErrorNotice, Modal } from "./controls";
import { Matching, decisionKey, type Decisions } from "./import-matching";
const storageKey = "strengthiva-transparency-import";
type Draft = { preview: ImportPreview; decisions: Decisions; step: number };
export function ImportWorkbookPage() {
  const [draft, setDraft] = useState<Draft>();
  const [result, setResult] = useState<ImportResult>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  const [confirm, setConfirm] = useState(false);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
        if (saved?.preview?.import_id && Array.isArray(saved.preview.unresolved))
          setDraft(saved);
      } catch {}
      setRestored(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);
  useEffect(() => {
    if (!restored) return;
    try {
      if (draft) sessionStorage.setItem(storageKey, JSON.stringify(draft));
      else sessionStorage.removeItem(storageKey);
    } catch {}
  }, [draft, restored]);
  async function upload(files: File[]) {
    const file = files[0];
    if (!file) return;
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      setError(
        new Error("Choose an .xlsx workbook or a single-tab .csv file.")
      );
      return;
    }
    setBusy(true);
    setError(undefined);
    setResult(undefined);
    try {
      setDraft({
        preview: await transparencyApi.preview(file),
        decisions: {},
        step: 1,
      });
    } catch (error) {
      setError(error as Error);
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    if (!draft) return;
    setBusy(true);
    setError(undefined);
    const products = draft.preview.unresolved
      .filter((name) => name.kind === "product")
      .flatMap((name) =>
        draft.decisions[decisionKey(name)]
          ? [draft.decisions[decisionKey(name)]]
          : []
      );
    const ingredients = draft.preview.unresolved
      .filter((name) => name.kind === "ingredient")
      .flatMap((name) =>
        draft.decisions[decisionKey(name)]
          ? [draft.decisions[decisionKey(name)]]
          : []
      );
    try {
      setResult(
        await transparencyApi.commit(draft.preview.import_id, {
          products,
          ingredients,
        })
      );
      setDraft(undefined);
      setConfirm(false);
    } catch (error) {
      setError(error as Error);
    } finally {
      setBusy(false);
    }
  }
  const step = result ? 3 : draft?.step || 0;
  const pending =
    draft?.preview.unresolved.filter(
      (name) => !draft.decisions[decisionKey(name)]
    ).length || 0;
  return (
    <>
      <PageHead
        eyebrow="Manufacturing intake"
        title="Import workbook"
        copy="Bring your manufacturing records together. Review first, resolve names, then save as drafts."
      />
      <ol className="stepper" aria-label="Import progress">
        {[
          "Upload workbook",
          "Preview records",
          "Match names",
          "Import result",
        ].map((label, index) => (
          <li
            className={`step ${
              step === index ? "active" : step > index ? "done" : ""
            }`}
            aria-current={step === index ? "step" : undefined}
            key={label}
          >
            <span className="step-num">
              {step > index ? <Icon name="check" /> : index + 1}
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ol>
      {error && !confirm && <ErrorNotice error={error} />}
      {busy && !draft && (
        <Notice title="Reading your workbook" tone="info">
          Checking rows and looking for known names. Your product records have
          not been saved.
        </Notice>
      )}
      {!draft && !result && (
        <div className="split">
          <Panel>
            <Dropzone
              accept=".xlsx,.csv"
              title="Drop your workbook here"
              copy="Choose one .xlsx workbook with your manufacturing tabs, or a single-tab .csv for repair work."
              disabled={busy || !restored}
              onFiles={upload}
            />
            <div className="file-guide">
              <Icon name="file" />
              <span>
                .xlsx · .csv · Preview before any records are imported
              </span>
            </div>
          </Panel>
          <aside className="section-stack">
            <Panel
              title="What belongs in the workbook"
              copy="The four related tabs keep your records connected."
            >
              <ul className="tab-guide">
                <li>
                  <strong>batch</strong>
                  <span>Manufacturing order and PO details</span>
                </li>
                <li>
                  <strong>batch_products</strong>
                  <span>Products, dates, and quality results</span>
                </li>
                <li>
                  <strong>batch_products_ingredients</strong>
                  <span>Quantities, sources, and QC status</span>
                </li>
                <li>
                  <strong>product_ingredients_mapping</strong>
                  <span>Standing recipes and ingredient names</span>
                </li>
              </ul>
            </Panel>
            <Notice title="Documents are uploaded separately" tone="info">
              After importing, attach product PDFs and reusable lab reports in
              the Documents and Lab reports sections.
            </Notice>
          </aside>
        </div>
      )}
      {draft && step === 1 && (
        <>
          <div className="split">
            <Panel
              title="Your workbook, ready for review"
              copy={draft.preview.filename}
            >
              <div className="stats">
                {[
                  [draft.preview.counts.batches, "Batches"],
                  [draft.preview.counts.batch_products, "Product records"],
                  [draft.preview.counts.ingredient_rows, "Ingredient rows"],
                  [draft.preview.counts.recipe_rows, "Recipe rows"],
                ].map(([value, label]) => (
                  <div className="stat" key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="preview-facts">
                <div>
                  <strong>{draft.preview.counts.products_matched}</strong>
                  <span>known product names</span>
                </div>
                <div>
                  <strong>{draft.preview.counts.products_new}</strong>
                  <span>new product names</span>
                </div>
                <div>
                  <strong>{draft.preview.counts.ingredients_matched}</strong>
                  <span>known ingredient names</span>
                </div>
                <div>
                  <strong>{draft.preview.unresolved.length}</strong>
                  <span>names to review</span>
                </div>
              </div>
              {draft.preview.conflicting_batches.length > 0 && (
                <Notice title="These batches already exist" tone="bad">
                  <p>{draft.preview.conflicting_batches.join(", ")}</p>
                  <p>
                    Existing batches cannot be re-imported. Review the saved
                    records or choose a workbook containing new batch numbers.
                  </p>
                  <Link href="/admin/batches" className="text-btn">
                    Review existing batches
                  </Link>
                </Notice>
              )}
            </Panel>
            <aside className="section-stack">
              <Notice title="Nothing has been published" tone="good">
                New records will be saved as drafts. You control when customers
                can see them.
              </Notice>
              <Panel title="Workbook notes">
                {draft.preview.warnings.length ? (
                  <ul className="review-list">
                    {draft.preview.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No parsing warnings were returned.</p>
                )}
              </Panel>
            </aside>
          </div>
          <div className="sticky-action">
            <Action disabled={busy} onClick={() => setDraft(undefined)}>
              Choose another workbook
            </Action>
            <Action
              tone="primary"
              disabled={!!draft.preview.conflicting_batches.length}
              onClick={() => setDraft({ ...draft, step: 2 })}
            >
              Review name matches <Icon name="arrow-right" />
            </Action>
          </div>
        </>
      )}
      {draft && step === 2 && (
        <>
          <Matching
            preview={draft.preview}
            decisions={draft.decisions}
            disabled={busy}
            onChange={(decisions) => setDraft({ ...draft, decisions })}
          />
          <div className="sticky-action">
            <Action
              disabled={busy}
              onClick={() => setDraft({ ...draft, step: 1 })}
            >
              Back to preview
            </Action>
            <span className="small muted">
              {pending
                ? `${pending} unreviewed names will be kept as separate entries.`
                : "All suggested names reviewed."}
            </span>
            <Action
              tone="primary"
              disabled={busy || !!draft.preview.conflicting_batches.length}
              onClick={() => setConfirm(true)}
            >
              Import draft records <Icon name="arrow-right" />
            </Action>
          </div>
        </>
      )}
      {result && (
        <Panel>
          <div className="import-result">
            <span className="empty-symbol">
              <Icon name="check" />
            </span>
            <div className="eyebrow">Import complete</div>
            <h2>Your records are safely in draft</h2>
            <p>
              {result.batch_products_created} product records and{" "}
              {result.counts.ingredient_rows} ingredient rows imported.
            </p>
            <Status tone="good" icon="refresh">
              {result.aliases_learned} aliases remembered for next time
            </Status>
            <div className="cluster">
              <Link className="btn btn-primary" href="/admin/batches">
                Review batches <Icon name="arrow-right" />
              </Link>
              <Action onClick={() => setResult(undefined)}>
                Import another workbook
              </Action>
            </div>
          </div>
          {result.auto_created.length > 0 && (
            <details className="disclosure">
              <summary>
                <Icon name="alert" />
                <strong>
                  {result.auto_created.length} unreviewed names were created
                  separately
                </strong>
                <Icon name="chevron-down" />
              </summary>
              <ul className="review-list">
                {result.auto_created.map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
              </ul>
              <Link className="text-btn" href="/admin/ingredients">
                Review ingredient library
              </Link>
            </details>
          )}
          {result.warnings.length > 0 && (
            <Notice title="Import notes" tone="warn">
              <ul>
                {result.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </Notice>
          )}
        </Panel>
      )}
      {confirm && (
        <Modal
          title="Import these draft records?"
          onClose={() => !busy && setConfirm(false)}
        >
          <p>
            {draft?.preview.counts.batches} batches and{" "}
            {draft?.preview.counts.batch_products} product records will be
            created. They will remain private drafts.
          </p>
          {pending > 0 && (
            <Notice title={`${pending} names are still unreviewed`} tone="warn">
              These names will be created as separate entries. No ingredient
              rows will be dropped.
            </Notice>
          )}
          {error && <ErrorNotice error={error} />}
          <div className="modal-actions">
            <Action disabled={busy} onClick={() => setConfirm(false)}>
              Keep reviewing
            </Action>
            <Action tone="primary" disabled={busy} onClick={commit}>
              {busy ? "Importing…" : "Confirm import"}
            </Action>
          </div>
        </Modal>
      )}
    </>
  );
}
