"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type {
  IngredientRow,
  IngredientRowInput,
  ProductDetail,
} from "@strengthiva/transparency/types";
import { outcome, quantity } from "@strengthiva/transparency/domain";
import {
  EmptyState,
  Icon,
  Notice,
  Panel,
  QualityStatus,
  Status,
} from "@strengthiva/transparency/ui";
import { publicDocumentUrl, transparencyApi } from "@/lib/transparency-api";
import { Action, ErrorNotice, Modal } from "./controls";
import { useResource } from "./use-resource";

/**
 * Every numeric cell is held as a STRING while editing.
 *
 * Parsing each keystroke fights the person typing: "9." is not a number, and a
 * controlled numeric input that rejects it either eats the keypress or moves the
 * caret. One conversion happens on save.
 */
type DraftRow = {
  /** Stable across re-renders, including for rows with no server id yet. */
  key: string;
  rowId: string | null;
  ingredientId: string | null;
  name: string;
  botanicalName: string | null;
  qtyValue: string;
  qtyUnit: string;
  qualityScore: string;
  sourceLocation: string;
  qcStatus: string;
  labReportId: string | null;
};

/** The vocabulary the client's data actually uses. See `mergeOption` for the rest. */
const UNIT_OPTIONS = ["mg", "ml", "g"];
const QC_OPTIONS = ["Passed", "Failed", "Verified", "Approved"];

/**
 * A select must never silently rewrite a value it did not offer.
 *
 * The QA columns are free text by design — the sheet's own vocabulary is
 * inconsistent — so a stored value outside the list is appended to it rather than
 * dropped. Without this, opening the editor on such a row and pressing save would
 * quietly change the record to whichever option happened to be first.
 */
function mergeOption(options: string[], current: string): string[] {
  const trimmed = current.trim();
  if (!trimmed || options.some((o) => o.toLowerCase() === trimmed.toLowerCase()))
    return options;
  return [...options, trimmed];
}

const text = (value: string | null | undefined) => value ?? "";
const num = (value: number | null) => (value === null ? "" : String(value));

function toDraft(row: IngredientRow): DraftRow {
  return {
    key: row.id,
    rowId: row.id,
    ingredientId: row.ingredient_id,
    name: row.name,
    botanicalName: row.botanical_name,
    qtyValue: num(row.qty_value),
    qtyUnit: text(row.qty_unit),
    qualityScore: num(row.quality_score),
    sourceLocation: text(row.source_location),
    qcStatus: text(row.qc_status),
    labReportId: row.lab_report_id,
  };
}

function blankDraft(): DraftRow {
  return {
    key: `new-${Math.random().toString(36).slice(2)}`,
    rowId: null,
    ingredientId: null,
    name: "",
    botanicalName: null,
    qtyValue: "",
    qtyUnit: "mg",
    qualityScore: "",
    sourceLocation: "",
    qcStatus: "",
    labReportId: null,
  };
}

/** Blank means "not recorded", which is a real value here and must stay null. */
function toNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInput(row: DraftRow): IngredientRowInput {
  return {
    // An existing row is identified by its ingredient, which is how the server
    // diffs the table. A new row sends the chosen or typed name instead, and the
    // server matches it against the alias table or creates it.
    ingredient_id: row.ingredientId,
    name: row.ingredientId ? null : row.name.trim(),
    qty_value: toNumber(row.qtyValue),
    qty_unit: row.qtyUnit.trim() || null,
    quality_score: toNumber(row.qualityScore),
    source_location: row.sourceLocation.trim() || null,
    qc_status: row.qcStatus.trim() || null,
    lab_report_id: row.labReportId,
  };
}

/**
 * Caught here rather than left to the API so the operator keeps what they typed.
 * A 422 is correct but throws the whole form away — this keeps the row in front
 * of them with the problem named.
 */
function problemWith(rows: DraftRow[]): string | null {
  if (rows.some((row) => !row.ingredientId && !row.name.trim()))
    return "Every row needs an ingredient.";

  const unparsedQty = rows.find(
    (row) => row.qtyValue.trim() && toNumber(row.qtyValue) === null
  );
  if (unparsedQty)
    return `“${unparsedQty.name}” has a quantity that is not a number.`;

  const unparsedScore = rows.find(
    (row) => row.qualityScore.trim() && toNumber(row.qualityScore) === null
  );
  if (unparsedScore)
    return `“${unparsedScore.name}” has a score that is not a number.`;

  const outOfRange = rows.find((row) => {
    const score = toNumber(row.qualityScore);
    return score !== null && (score < 0 || score > 100);
  });
  if (outOfRange) return `“${outOfRange.name}” has a score outside 0–100.`;

  const seen = new Set<string>();
  for (const row of rows) {
    const label = row.ingredientId || row.name.trim().toLowerCase();
    if (!label) continue;
    if (seen.has(label))
      return `“${row.name}” appears twice. Each ingredient gets one row.`;
    seen.add(label);
  }
  return null;
}

export function IngredientEditor({
  product,
  onChange,
  onDirtyChange,
}: {
  product: ProductDetail;
  onChange: (product: ProductDetail) => void;
  /**
   * Reported upward so the record page can stop a tab link throwing away unsaved
   * rows. The editor cannot guard that itself — the tabs are not its children.
   */
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  /** The last row removed, kept so a mis-click is undoable without discarding
      every other edit — which is all Cancel could offer. */
  const [undo, setUndo] = useState<{ row: DraftRow; at: number } | null>(null);
  const [rows, setRows] = useState<DraftRow[]>(() =>
    product.ingredients.map(toDraft)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");

  const master = useResource("ingredient-master", (signal) =>
    transparencyApi.ingredients(signal)
  );
  const ingredientOptions = useMemo(
    () =>
      (master.data || [])
        .map((item) => ({ id: item.id, name: item.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [master.data]
  );

  const live = product.status === "published";
  const dirty =
    JSON.stringify(rows.map(toInput)) !==
    JSON.stringify(product.ingredients.map(toDraft).map(toInput));

  // Only meaningful while the editor is open; a closed editor is never "dirty".
  const unsaved = editing && dirty;
  useEffect(() => {
    onDirtyChange?.(unsaved);
    return () => onDirtyChange?.(false);
  }, [unsaved, onDirtyChange]);

  function begin() {
    setRows(product.ingredients.map(toDraft));
    setError(undefined);
    setMessage("");
    setReason("");
    setUndo(null);
    setEditing(true);
  }

  function cancel() {
    setRows(product.ingredients.map(toDraft));
    setEditing(false);
    setError(undefined);
    setReason("");
    setUndo(null);
  }

  function removeRow(key: string) {
    setRows((current) => {
      const at = current.findIndex((item) => item.key === key);
      if (at < 0) return current;
      setUndo({ row: current[at], at });
      return current.filter((item) => item.key !== key);
    });
    setMessage("");
  }

  function undoRemove() {
    if (!undo) return;
    setRows((current) => {
      const next = [...current];
      next.splice(Math.min(undo.at, next.length), 0, undo.row);
      return next;
    });
    setUndo(null);
  }

  function cell(key: string, field: keyof DraftRow, value: string) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
    setMessage("");
  }

  function attemptSave() {
    const problem = problemWith(rows);
    if (problem) {
      setError(new Error(problem));
      return;
    }
    setError(undefined);
    if (live) setConfirming(true);
    else void save();
  }

  async function save() {
    setBusy(true);
    setError(undefined);
    try {
      const updated = await transparencyApi.replaceIngredients(
        product.id,
        rows.map(toInput),
        reason.trim() || null
      );
      onChange(updated);
      setRows(updated.ingredients.map(toDraft));
      setEditing(false);
      setConfirming(false);
      setReason("");
      setMessage("Ingredient list saved.");
    } catch (error) {
      setError(error as Error);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      title="Ingredient traceability"
      copy={
        editing
          ? "Order here is the order customers see. Leave a field blank for “not recorded” — blank is never shown as a pass."
          : `${product.ingredients.length} rows. Quality scores and source details are kept per ingredient row.`
      }
      /* While editing, the panel header carries no actions at all: saving this
         panel's content belongs at the bottom of this panel, next to the last row
         someone touched. See the sticky bar below. */
      actions={
        editing ? undefined : (
          <>
            <Link
              className="btn btn-secondary"
              href={`/admin/reports?batch=${product.batch_id}`}
            >
              Attach lab reports
            </Link>
            <Action tone="primary" onClick={begin}>
              Edit ingredients
            </Action>
          </>
        )
      }
    >
      {message && (
        <div role="status">
          <Notice title={message} tone="good" />
        </div>
      )}
      {editing && live && (
        <Notice title="This record is live" tone="warn">
          Saved ingredient changes appear on the customer page immediately. Every
          change is recorded in this record’s history.
        </Notice>
      )}
      {error && <ErrorNotice error={error} />}

      {editing ? (
        /* Editing deliberately leaves the table behind.
           The read-only table is 940px wide and scrolls sideways, which is fine to
           read but unusable to fill in: inside this column the Source field was
           clipped to "test,locati" and QC status sat off the right edge. Cards wrap
           to the width available, so every field is visible and labelled. */
        <>
          <div className="ingredient-edit-list">
            {rows.map((row, index) => {
              const units = mergeOption(UNIT_OPTIONS, row.qtyUnit);
              const statuses = mergeOption(QC_OPTIONS, row.qcStatus);
              return (
                <article className="ingredient-edit-card" key={row.key}>
                  <header className="ingredient-edit-head">
                    <div className="ingredient-edit-identity">
                      {row.rowId ? (
                        <>
                          <strong>{row.name}</strong>
                          <span className="sub">
                            <em>
                              {row.botanicalName ||
                                "Botanical name not recorded"}
                            </em>
                          </span>
                        </>
                      ) : (
                        <label className="field">
                          <span>Ingredient</span>
                          <select
                            className="input"
                            value={row.ingredientId || ""}
                            disabled={busy}
                            onChange={(event) => {
                              const id = event.target.value;
                              const found = ingredientOptions.find(
                                (option) => option.id === id
                              );
                              setRows((current) =>
                                current.map((item) =>
                                  item.key === row.key
                                    ? {
                                        ...item,
                                        ingredientId: id || null,
                                        name: found ? found.name : item.name,
                                      }
                                    : item
                                )
                              );
                              setMessage("");
                            }}
                          >
                            <option value="">
                              {master.loading
                                ? "Loading ingredients…"
                                : "Choose an ingredient…"}
                            </option>
                            {ingredientOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                          {!row.ingredientId && (
                            <input
                              className="input"
                              value={row.name}
                              disabled={busy}
                              placeholder="…or type a new ingredient name"
                              aria-label="New ingredient name"
                              onChange={(event) =>
                                cell(row.key, "name", event.target.value)
                              }
                            />
                          )}
                          <span className="help">
                            Pick from the library, or type a name to add it.
                          </span>
                        </label>
                      )}
                    </div>
                    <div className="ingredient-edit-rowmeta">
                      <span className="tiny muted">Position {index + 1}</span>
                      <Action
                        tone="danger"
                        disabled={busy}
                        onClick={() => removeRow(row.key)}
                      >
                        Remove
                      </Action>
                    </div>
                  </header>

                  <div className="ingredient-edit-fields">
                    <label className="field">
                      <span>Quantity</span>
                      <span className="cell-pair">
                        <input
                          className="input mono"
                          inputMode="decimal"
                          value={row.qtyValue}
                          disabled={busy}
                          placeholder="—"
                          onChange={(event) =>
                            cell(row.key, "qtyValue", event.target.value)
                          }
                        />
                        <select
                          className="input cell-unit"
                          value={row.qtyUnit}
                          disabled={busy}
                          aria-label="Unit"
                          onChange={(event) =>
                            cell(row.key, "qtyUnit", event.target.value)
                          }
                        >
                          <option value="">—</option>
                          {units.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </span>
                    </label>

                    <label className="field">
                      <span>Internal score</span>
                      <input
                        className="input mono"
                        inputMode="decimal"
                        value={row.qualityScore}
                        disabled={busy}
                        placeholder="—"
                        onChange={(event) =>
                          cell(row.key, "qualityScore", event.target.value)
                        }
                      />
                      <span className="help">0–100, or blank</span>
                    </label>

                    <label className="field">
                      <span>QC status</span>
                      <select
                        className="input"
                        value={row.qcStatus}
                        disabled={busy}
                        onChange={(event) =>
                          cell(row.key, "qcStatus", event.target.value)
                        }
                      >
                        <option value="">Not recorded</option>
                        {statuses.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field ingredient-edit-source">
                      <span>Source</span>
                      <input
                        className="input"
                        value={row.sourceLocation}
                        disabled={busy}
                        placeholder="Not recorded"
                        onChange={(event) =>
                          cell(row.key, "sourceLocation", event.target.value)
                        }
                      />
                      <span className="help">
                        Where this material came from, as you want it shown.
                      </span>
                    </label>

                    <div className="field">
                      <span>Lab report</span>
                      <div className="ingredient-edit-report">
                        {row.labReportId ? (
                          <Status tone="good" icon="check">
                            Attached
                          </Status>
                        ) : (
                          <span className="tiny muted">
                            None — attach from Lab reports
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                </article>
              );
            })}
          </div>

          {/* "Add" appends to the list, so it sits at the end of the list it
              appends to — not in the header, where it would read as a page-level
              action like "New batch". */}
          <div className="form-actions">
            <Action
              disabled={busy}
              onClick={() => {
                setRows((current) => [...current, blankDraft()]);
                setUndo(null);
              }}
            >
              Add ingredient
            </Action>
          </div>

          {/* Sticky, because a 27-ingredient record is ~11,000px tall and a save
              control pinned to the top of the panel is ten screens away from the
              row being edited. */}
          <div className="editor-bar">
            <div className="editor-bar-status">
              {undo ? (
                <span role="status">
                  Removed <strong>{undo.row.name || "a row"}</strong>.{" "}
                  <button type="button" className="text-btn" onClick={undoRemove}>
                    Undo
                  </button>
                </span>
              ) : (
                <span className="tiny muted">
                  {rows.length} {rows.length === 1 ? "ingredient" : "ingredients"}
                  {dirty ? " · unsaved changes" : ""}
                </span>
              )}
            </div>
            <div className="editor-bar-actions">
              <Action disabled={busy} onClick={cancel}>
                Cancel
              </Action>
              {/* Not "Save changes" — the record's own save uses that label, and
                  two identical primary buttons is a way to save the wrong thing. */}
              <Action
                tone="primary"
                disabled={busy || !dirty}
                onClick={attemptSave}
              >
                {busy ? "Saving…" : "Save ingredients"}
              </Action>
            </div>
          </div>
        </>
      ) : product.ingredients.length ? (
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
                      product.status === "published" ? (
                        <a
                          className="text-btn"
                          href={publicDocumentUrl(product.id, row.lab_report_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View PDF <Icon name="external" />
                        </a>
                      ) : (
                        <Status tone="good" icon="check">
                          Attached
                        </Status>
                      )
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
          Choose “Edit ingredients” to add them, or import the batch workbook.
        </EmptyState>
      )}

      {confirming && (
        <Modal
          title="Save ingredient changes to a live record?"
          onClose={() => !busy && setConfirming(false)}
        >
          <p>
            Customers scanning this product’s QR code will see the saved
            ingredient list immediately.
          </p>
          <label className="field">
            <span>Reason for this change (optional)</span>
            <input
              className="input"
              value={reason}
              disabled={busy}
              placeholder="e.g. re-tested after resampling"
              onChange={(event) => setReason(event.target.value)}
            />
            <span className="help">
              Stored with the change in this record’s history. The date and time
              are recorded either way.
            </span>
          </label>
          {error && <ErrorNotice error={error} />}
          <div className="modal-actions">
            <Action disabled={busy} onClick={() => setConfirming(false)}>
              Cancel
            </Action>
            <Action tone="primary" disabled={busy} onClick={() => void save()}>
              {busy ? "Saving…" : "Save live changes"}
            </Action>
          </div>
        </Modal>
      )}
    </Panel>
  );
}
