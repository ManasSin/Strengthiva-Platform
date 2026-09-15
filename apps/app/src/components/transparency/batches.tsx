"use client";
import { useState } from "react";
import Link from "next/link";
import {
  csvCell,
  formatDate,
  publication,
} from "@strengthiva/transparency/domain";
import {
  EmptyState,
  Icon,
  Loading,
  PageHead,
  Panel,
  Status,
} from "@strengthiva/transparency/ui";
import { transparencyApi, downloadBlob } from "@/lib/transparency-api";
import { useResource } from "./use-resource";
import { Action, ErrorNotice } from "./controls";
export function PublicationStatus({ value }: { value: string }) {
  return (
    <Status
      tone={
        value === "published"
          ? "good"
          : value === "partial"
          ? "warn"
          : "neutral"
      }
      icon={
        value === "published"
          ? "check"
          : value === "partial"
          ? "alert"
          : undefined
      }
    >
      {value === "published"
        ? "Published"
        : value === "partial"
        ? "Partly published"
        : "Draft"}
    </Status>
  );
}
export function BatchesPage() {
  const resource = useResource("batches", (signal) =>
    transparencyApi.batches(signal)
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorNotice error={resource.error} retry={resource.reload} />;
  const batches = resource.data || [];
  const filtered = batches
    .filter(
      (batch) =>
        `${batch.batch_number} ${batch.po_number || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (filter === "all" || publication(batch) === filter)
    )
    .sort((a, b) =>
      sort === "name"
        ? a.batch_number.localeCompare(b.batch_number, undefined, {
            numeric: true,
          })
        : sort === "oldest"
        ? a.created_at.localeCompare(b.created_at)
        : b.created_at.localeCompare(a.created_at)
    );
  const rows = filtered.slice(page * 25, (page + 1) * 25);
  function exportCsv() {
    const values = [
      ["Batch", "PO number", "Order date", "Products", "Published", "State"],
      ...filtered.map((batch) => [
        batch.batch_number,
        batch.po_number,
        batch.order_date,
        batch.product_count,
        batch.published_count,
        publication(batch),
      ]),
    ];
    downloadBlob(
      new Blob(
        [
          "\ufeff" +
            values.map((row) => row.map(csvCell).join(",")).join("\r\n"),
        ],
        { type: "text/csv;charset=utf-8" }
      ),
      "strengthiva-batches.csv"
    );
  }
  return (
    <>
      <PageHead
        eyebrow="Manufacturing records"
        title="Batches"
        copy="Track each manufacturing order from workbook import to customer publication."
        actions={
          <Link className="btn btn-primary" href="/admin/import">
            <Icon name="upload" />
            Import workbook
          </Link>
        }
      />
      <div className="stats">
        {[
          [batches.length, "Manufacturing orders"],
          [batches.reduce((n, b) => n + b.product_count, 0), "Product records"],
          [
            batches.reduce((n, b) => n + b.published_count, 0),
            "Published records",
          ],
          [
            batches.reduce(
              (n, b) => n + b.product_count - b.published_count,
              0
            ),
            "Draft records",
          ],
        ].map(([value, label]) => (
          <div className="stat" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <Panel
        title="Manufacturing orders"
        copy="Open a batch to review its product records and publication readiness."
      >
        <div className="toolbar">
          <label className="search">
            <Icon name="search" />
            <input
              className="input"
              aria-label="Search batch or PO number"
              placeholder="Search batch or PO number"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
            />
          </label>
          <select
            className="select toolbar-select"
            aria-label="Filter publication state"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(0);
            }}
          >
            <option value="all">All states</option>
            <option value="published">Published</option>
            <option value="partial">Partly published</option>
            <option value="draft">Draft</option>
          </select>
          <select
            className="select toolbar-select"
            aria-label="Sort batches"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(0);
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Batch number</option>
          </select>
          <Action disabled={!filtered.length} onClick={exportCsv}>
            <Icon name="download" />
            Export
          </Action>
        </div>
        {rows.length ? (
          <div
            className="table-frame"
            role="region"
            aria-label="Manufacturing orders table"
            tabIndex={0}
          >
            <table className="table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>PO number</th>
                  <th>Order date</th>
                  <th>Products</th>
                  <th>Publication</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((batch) => (
                  <tr key={batch.id}>
                    <td>
                      <strong>{batch.batch_number}</strong>
                      <span className="sub">Manufacturing order</span>
                    </td>
                    <td className="mono">{batch.po_number || "—"}</td>
                    <td>{formatDate(batch.order_date)}</td>
                    <td>{batch.product_count} products</td>
                    <td>
                      <PublicationStatus value={publication(batch)} />
                      <span className="sub">
                        {batch.published_count} of {batch.product_count} public
                      </span>
                    </td>
                    <td>
                      <Link
                        className="table-action"
                        href={`/admin/batches/${batch.id}`}
                      >
                        Open batch <Icon name="arrow-right" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={
              batches.length
                ? "No batches found"
                : "Your batch register starts here"
            }
            action={
              batches.length ? undefined : (
                <Link href="/admin/import" className="btn btn-primary">
                  Import your first workbook
                </Link>
              )
            }
          >
            {batches.length
              ? "Try a different search or publication filter."
              : "Upload a manufacturing workbook to create draft product records."}
          </EmptyState>
        )}
        {filtered.length > 25 && (
          <div className="pagination">
            <span>
              Showing {page * 25 + 1}–
              {Math.min((page + 1) * 25, filtered.length)} of {filtered.length}
            </span>
            <Action disabled={!page} onClick={() => setPage(page - 1)}>
              Previous
            </Action>
            <Action
              disabled={(page + 1) * 25 >= filtered.length}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Action>
          </div>
        )}
      </Panel>
    </>
  );
}
