"use client";
import type {
  AuditEntry,
  ProductDetail,
} from "@strengthiva/transparency/types";
import {
  EmptyState,
  Loading,
  Notice,
  Panel,
} from "@strengthiva/transparency/ui";
import { transparencyApi } from "@/lib/transparency-api";
import { ErrorNotice } from "./controls";
import { useResource } from "./use-resource";

/**
 * Column names are not labels. The log stores the column that changed, because
 * that is what is unambiguous to store; this is where it becomes readable.
 *
 * An unmapped field falls back to its own name rather than being hidden — a newly
 * loggable column should degrade to something ugly, not to nothing.
 */
const FIELD_LABELS: Record<string, string> = {
  received_date: "Received date",
  manufacturing_date: "Manufacturing date",
  expiry_date: "Expiry date",
  qa_raw_material: "Raw material check",
  qa_heavy_metals: "Heavy metals check",
  qa_pesticide: "Pesticide residue check",
  qa_microbial: "Microbial limits check",
  qa_final: "Final QA check",
  qty_value: "Quantity",
  qty_unit: "Unit",
  quality_score: "Internal score",
  source_location: "Source",
  qc_status: "QC status",
  lab_report_document_id: "Lab report",
  ingredient_id: "Ingredient",
  position: "Row order",
};

const label = (field: string) => FIELD_LABELS[field] || field;

/** "not recorded" rather than a blank, so a cleared field reads as deliberate. */
const shown = (raw: string | null) => raw ?? "not recorded";

function when(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  return at.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * `field === "row"` marks a row appearing or disappearing rather than a column
 * changing, so it reads as a sentence instead of a before/after pair.
 */
function describe(entry: AuditEntry): string {
  if (entry.field === "row") {
    return entry.new_value === null
      ? `Removed ${entry.entity_label || "an ingredient"}`
      : `Added ${entry.entity_label || "an ingredient"}`;
  }
  const subject = entry.entity_label
    ? `${entry.entity_label} · ${label(entry.field)}`
    : label(entry.field);
  return `${subject}: ${shown(entry.old_value)} → ${shown(entry.new_value)}`;
}

export function RecordHistory({ product }: { product: ProductDetail }) {
  const resource = useResource(`history-${product.id}`, (signal) =>
    transparencyApi.history(product.id, signal)
  );

  return (
    <Panel
      title="Change history"
      copy="Every edit to this record, newest first. Internal only — never shown on the customer page."
    >
      {resource.loading && <Loading label="Loading history" />}
      {resource.error && (
        <ErrorNotice error={resource.error} retry={resource.reload} />
      )}
      {resource.data &&
        (resource.data.length ? (
          <>
            <div
              className="table-frame"
              role="region"
              aria-label="Change history"
              tabIndex={0}
            >
              <table className="table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Change</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {resource.data.map((entry) => (
                    <tr key={entry.id}>
                      <td className="mono">{when(entry.changed_at)}</td>
                      <td>{describe(entry)}</td>
                      <td>
                        {entry.reason || (
                          <span className="tiny muted">Not given</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {resource.data.length >= 200 && (
              <Notice title="Showing the 200 most recent changes" tone="info">
                Older entries are kept, but not listed here.
              </Notice>
            )}
          </>
        ) : (
          <EmptyState title="No changes recorded">
            Edits made from here on are listed with their date and time.
          </EmptyState>
        ))}
    </Panel>
  );
}
