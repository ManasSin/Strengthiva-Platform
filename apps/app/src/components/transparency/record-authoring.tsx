"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BatchDetail,
  ProductSearchResult,
} from "@strengthiva/transparency/types";
import { Notice, PageHead, Panel } from "@strengthiva/transparency/ui";
import { transparencyApi } from "@/lib/transparency-api";
import { Action, Breadcrumbs, ErrorNotice, Modal } from "./controls";

/**
 * Creating a manufacturing order, normally before anything has been made.
 *
 * This is what makes printing labels early possible: the client knows the batch
 * number well in advance, and once the batch exists its product records — and so
 * their QR codes — can be reserved immediately.
 */
export function NewBatchForm() {
  const router = useRouter();
  const [batchNumber, setBatchNumber] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();

  async function create() {
    if (!batchNumber.trim()) {
      setError(new Error("A batch number is required."));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const batch = await transparencyApi.createBatch({
        batch_number: batchNumber.trim(),
        po_number: poNumber.trim() || null,
        order_date: orderDate || null,
      });
      router.push(`/admin/batches/${batch.id}`);
    } catch (error) {
      setError(error as Error);
      setBusy(false);
    }
  }

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Batches", href: "/admin/batches" }, { label: "New" }]}
      />
      <PageHead
        eyebrow="Manufacturing order"
        title="New batch"
        copy="Open an order before manufacturing starts, so its labels can be printed in advance."
      />
      <Panel
        title="Batch details"
        copy="Only the batch number is required. Everything else can be filled in later."
      >
        <div className="form-grid">
          <label className="field">
            <span>Batch number</span>
            <input
              className="input mono"
              value={batchNumber}
              disabled={busy}
              placeholder="ABC-001"
              onChange={(event) => setBatchNumber(event.target.value)}
            />
            <span className="help">
              Permanent. A batch number cannot be changed once the batch exists.
            </span>
          </label>
          <label className="field">
            <span>PO number</span>
            <input
              className="input"
              value={poNumber}
              disabled={busy}
              placeholder="Optional"
              onChange={(event) => setPoNumber(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Order date</span>
            <input
              className="input"
              type="date"
              value={orderDate}
              disabled={busy}
              onChange={(event) => setOrderDate(event.target.value)}
            />
            <span className="help">Optional</span>
          </label>
        </div>
        {error && <ErrorNotice error={error} />}
        <div className="form-actions">
          <Action disabled={busy} onClick={() => router.push("/admin/batches")}>
            Cancel
          </Action>
          <Action tone="primary" disabled={busy} onClick={() => void create()}>
            {busy ? "Creating…" : "Create batch"}
          </Action>
        </div>
      </Panel>
    </>
  );
}

/**
 * Add a product to a batch — the moment a QR code becomes printable.
 *
 * The product field is a search rather than a plain text box so that picking an
 * existing product carries its standing recipe across. A product that has been
 * made before should not have its ingredients retyped.
 */
export function AddRecordDialog({
  batch,
  onClose,
}: {
  batch: BatchDetail;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [chosen, setChosen] = useState<ProductSearchResult | null>(null);
  const [seed, setSeed] = useState(true);
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<Error>();

  // Debounced, and aborted on each new keystroke. The endpoint is rate limited at
  // 120/min precisely because it is called while someone types, and a stale
  // response arriving late would otherwise overwrite a newer one.
  useEffect(() => {
    if (chosen) return;
    const term = query.trim();
    // Nothing to search for. The list is already hidden at render time when the
    // box is empty, so there is no state to clear here — and clearing it would
    // mean a setState in an effect body, which cascades a render for nothing.
    if (!term) return;
    const controller = new AbortController();
    // Set when the request actually starts rather than during the debounce
    // window: "Searching…" should describe a request in flight, not a pause in
    // typing. It also keeps setState out of the effect body.
    const timer = setTimeout(() => {
      setSearching(true);
      transparencyApi
        .searchProducts(term, controller.signal)
        .then((hits) => {
          if (!controller.signal.aborted) {
            setResults(hits);
            setSearching(false);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, chosen]);

  const typedName = query.trim();
  const exactMatch = results.some(
    (hit) => hit.name.toLowerCase() === typedName.toLowerCase()
  );

  async function create() {
    if (!chosen && !typedName) {
      setError(new Error("Choose a product, or type a new one."));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const record = await transparencyApi.createRecord({
        batch_id: batch.id,
        product_id: chosen?.id ?? null,
        product_name: chosen ? null : typedName,
        seed_from_recipe: seed,
      });
      router.push(`/admin/batches/${batch.id}/products/${record.id}`);
    } catch (error) {
      setError(error as Error);
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`Add a product to ${batch.batch_number}`}
      onClose={() => !busy && onClose()}
    >
      <p>
        The record is created as a draft. Its QR code can be downloaded and
        printed straight away — scanning it shows nothing until the record is
        published.
      </p>

      <label className="field">
        <span>Product</span>
        <input
          className="input"
          value={chosen ? chosen.name : query}
          disabled={busy}
          placeholder="Start typing a product name"
          autoComplete="off"
          aria-label="Product name"
          onChange={(event) => {
            setChosen(null);
            setQuery(event.target.value);
            setError(undefined);
          }}
        />
        <span className="help">
          {chosen
            ? chosen.recipe_item_count
              ? `${chosen.name} has a standing recipe of ${chosen.recipe_item_count} ingredients.`
              : `${chosen.name} has no standing recipe yet — the table starts empty.`
            : "Pick an existing product to carry its ingredients across, or type a new name to create it."}
        </span>
      </label>

      {!chosen && typedName && (
        <div className="stack">
          {searching && <p className="tiny muted">Searching…</p>}
          {!searching && results.length > 0 && (
            <ul className="plain-list">
              {results.map((hit) => (
                <li key={hit.id}>
                  <Action disabled={busy} onClick={() => setChosen(hit)}>
                    {hit.name}
                    <span className="tiny muted">
                      {hit.recipe_item_count
                        ? ` · ${hit.recipe_item_count} ingredients`
                        : " · no recipe yet"}
                      {hit.batch_count ? ` · ${hit.batch_count} batches` : ""}
                    </span>
                  </Action>
                </li>
              ))}
            </ul>
          )}
          {!searching && !exactMatch && (
            <Notice
              title={`“${typedName}” will be created as a new product`}
              tone="info"
            >
              Its ingredient table starts empty, and becomes this product’s
              standing recipe for future batches.
            </Notice>
          )}
        </div>
      )}

      {chosen && chosen.recipe_item_count > 0 && (
        <label className="field">
          <span>
            <input
              type="checkbox"
              checked={seed}
              disabled={busy}
              onChange={(event) => setSeed(event.target.checked)}
            />{" "}
            Start from the standing recipe
          </span>
          <span className="help">
            Copies {chosen.recipe_item_count} ingredients in. Rows can be added or
            removed afterwards.
          </span>
        </label>
      )}

      {error && <ErrorNotice error={error} />}
      <div className="modal-actions">
        <Action disabled={busy} onClick={onClose}>
          Cancel
        </Action>
        <Action tone="primary" disabled={busy} onClick={() => void create()}>
          {busy ? "Creating…" : "Create draft record"}
        </Action>
      </div>
    </Modal>
  );
}
