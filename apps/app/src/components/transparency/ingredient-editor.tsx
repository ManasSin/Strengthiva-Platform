"use client";
import { useMemo, useState } from "react";
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
 * Every cell is held as a STRING while editing.
 *
 * Parsing on each keystroke fights the person typing: "9." is not a number, and a
 * controlled numeric input that rejects it either eats the keypress or snaps the
 * caret. Strings go in; `toNumber` converts once, on save.
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
    // diffs the table. A new row sends the typed name instead, and the server
    // matches it against the alias table or creates it.
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
 * Caught here rather than left to the API so the operator keeps their typed table.
 * A 422 is correct but discards nothing useful — this keeps the row in front of them.
 */
function problemWith(rows: DraftRow[]): string | null {
  if (rows.some((row) => !row.ingredientId && !row.name.trim()))
    return "Every row needs an ingredient name.";

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
}: {
  product: ProductDetail;
  onChange: (product: ProductDetail) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<DraftRow[]>(() =>
    product.ingredients.map(toDraft)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");

  // The ingredient master, for the name suggestions on added rows. A plain
  // datalist rather than a custom combobox: the browser's own list is keyboard
  // accessible for free, and typing a name the list does NOT contain is a
  // supported action here, not a mistake.
  const master = useResource("ingredient-master", (signal) =>
    transparencyApi.ingredients(signal)
  );
  const suggestions = useMemo(
    () => (master.data || []).map((item) => item.name).sort(),
    [master.data]
  );

  const live = product.status === "published";
  const dirty =
    JSON.stringify(rows.map(toInput)) !==
    JSON.stringify(product.ingredients.map(toDraft).map(toInput));

  function begin() {
    setRows(product.ingredients.map(toDraft));
    setError(undefined);
    setMessage("");
    setReason("");
    setEditing(true);
  }

  function cancel() {
    setRows(product.ingredients.map(toDraft));
    setEditing(false);
    setError(undefined);
    setReason("");
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
    // A live record gets the same confirmation the dates and quality tabs use:
    // the change reaches the customer page the moment it saves.
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
      setMessage("Ingredient table saved.");
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
          ? "Row order sets the order customers see. Blank means “not recorded”, which is never shown as a pass."
          : `${product.ingredients.length} rows. Quality scores and source details are kept per ingredient row.`
      }
      actions={
        editing ? (
          <>
            <Action disabled={busy} onClick={cancel}>
              Cancel
            </Action>
            <Action
              tone="primary"
              disabled={busy || !dirty}
              onClick={attemptSave}
            >
              {busy ? "Saving…" : "Save table"}
            </Action>
          </>
        ) : (
          <>
            <Link
              className="btn btn-secondary"
              href={`/admin/reports?batch=${product.batch_id}`}
            >
              Attach lab reports
            </Link>
            <Action tone="primary" onClick={begin}>
              Edit table
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

      {rows.length || editing ? (
        <div
          className="table-frame"
          role="region"
          aria-label="Ingredient traceability table"
          tabIndex={0}
        >
          <table
            className={`table ingredients-table ${editing ? "editing" : ""}`}
          >
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Quantity</th>
                <th>Internal score</th>
                <th>Source</th>
                <th>QC status</th>
                <th>Lab report</th>
                {editing && <th aria-label="Remove row" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td>
                    {row.rowId ? (
                      <>
                        <strong>{row.name}</strong>
                        <span className="sub">
                          <em>
                            {row.botanicalName || "Botanical name not recorded"}
                          </em>
                        </span>
                      </>
                    ) : (
                      <>
                        <input
                          className="input"
                          list="ingredient-names"
                          value={row.name}
                          disabled={busy}
                          placeholder="Ingredient name"
                          aria-label="Ingredient name"
                          onChange={(event) =>
                            cell(row.key, "name", event.target.value)
                          }
                        />
                        <span className="sub">
                          <em>Matched to the ingredient master, or added to it.</em>
                        </span>
                      </>
                    )}
                  </td>
                  <td className="mono">
                    {editing ? (
                      <span className="cell-pair">
                        <input
                          className="input"
                          inputMode="decimal"
                          value={row.qtyValue}
                          disabled={busy}
                          placeholder="—"
                          aria-label={`Quantity for ${row.name || "new row"}`}
                          onChange={(event) =>
                            cell(row.key, "qtyValue", event.target.value)
                          }
                        />
                        <input
                          className="input cell-unit"
                          list="qty-units"
                          value={row.qtyUnit}
                          disabled={busy}
                          aria-label={`Unit for ${row.name || "new row"}`}
                          onChange={(event) =>
                            cell(row.key, "qtyUnit", event.target.value)
                          }
                        />
                      </span>
                    ) : (
                      quantity(toNumber(row.qtyValue), row.qtyUnit || null)
                    )}
                  </td>
                  <td className="mono">
                    {editing ? (
                      <input
                        className="input"
                        inputMode="decimal"
                        value={row.qualityScore}
                        disabled={busy}
                        placeholder="—"
                        aria-label={`Internal score for ${row.name || "new row"}`}
                        onChange={(event) =>
                          cell(row.key, "qualityScore", event.target.value)
                        }
                      />
                    ) : row.qualityScore ? (
                      `${row.qualityScore} / 100`
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {editing ? (
                      <input
                        className="input"
                        value={row.sourceLocation}
                        disabled={busy}
                        placeholder="Not recorded"
                        aria-label={`Source for ${row.name || "new row"}`}
                        onChange={(event) =>
                          cell(row.key, "sourceLocation", event.target.value)
                        }
                      />
                    ) : (
                      row.sourceLocation || "Not recorded"
                    )}
                  </td>
                  <td>
                    {editing ? (
                      <span className="cell-pair">
                        <input
                          className="input"
                          list="qa-results"
                          value={row.qcStatus}
                          disabled={busy}
                          placeholder="Not recorded"
                          aria-label={`QC status for ${row.name || "new row"}`}
                          onChange={(event) =>
                            cell(row.key, "qcStatus", event.target.value)
                          }
                        />
                        <QualityStatus value={outcome(row.qcStatus)} />
                      </span>
                    ) : (
                      <>
                        <QualityStatus value={outcome(row.qcStatus)} />
                        {row.qcStatus && outcome(row.qcStatus) === null && (
                          <span className="sub">{row.qcStatus}</span>
                        )}
                      </>
                    )}
                  </td>
                  <td>
                    {row.labReportId ? (
                      product.status === "published" && !editing ? (
                        <a
                          className="text-btn"
                          href={publicDocumentUrl(product.id, row.labReportId)}
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
                    ) : editing ? (
                      <span className="tiny muted">Attach after saving</span>
                    ) : (
                      <Link
                        className="text-btn"
                        href={`/admin/reports?batch=${product.batch_id}`}
                      >
                        Attach report
                      </Link>
                    )}
                  </td>
                  {editing && (
                    <td>
                      <Action
                        tone="danger"
                        disabled={busy}
                        onClick={() =>
                          setRows((current) =>
                            current.filter((item) => item.key !== row.key)
                          )
                        }
                      >
                        Remove
                      </Action>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No ingredients recorded">
          Add them here, or import the batch workbook.
        </EmptyState>
      )}

      {editing && (
        <>
          <datalist id="ingredient-names">
            {suggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <datalist id="qty-units">
            <option value="mg" />
            <option value="ml" />
            <option value="g" />
          </datalist>
          <datalist id="qa-results">
            <option value="Passed" />
            <option value="Failed" />
            <option value="Verified" />
            <option value="Approved" />
          </datalist>
          <div className="form-actions">
            <Action
              disabled={busy}
              onClick={() => setRows((current) => [...current, blankDraft()])}
            >
              Add ingredient
            </Action>
          </div>
        </>
      )}

      {confirming && (
        <Modal
          title="Save ingredient changes to a live record?"
          onClose={() => !busy && setConfirming(false)}
        >
          <p>
            Customers scanning this product’s QR code will see the saved
            ingredient table immediately.
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
