"use client";
import { useState } from "react";
import type { IngredientMaster } from "@strengthiva/transparency/types";
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
import { Action, ErrorNotice, Modal } from "./controls";
export function IngredientsPage() {
  const resource = useResource("ingredient-master", (signal) =>
    transparencyApi.ingredients(signal)
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<IngredientMaster>();
  const [message, setMessage] = useState("");
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorNotice error={resource.error} retry={resource.reload} />;
  const ingredients = resource.data || [];
  const filtered = ingredients.filter(
    (row) =>
      `${row.name} ${row.botanical_name || ""} ${row.plant_part || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "all" ||
        (filter === "missing" && !row.botanical_name) ||
        (filter === "aliases" && row.alias_count > 0))
  );
  return (
    <>
      <PageHead
        eyebrow="Master data"
        title="Ingredients"
        copy="Maintain canonical names, review botanical suggestions, and preserve deliberate differences between materials."
      />
      {message && (
        <div role="status">
          <Notice title={message} tone="good" />
        </div>
      )}
      <Panel>
        <div className="toolbar">
          <label className="search">
            <Icon name="search" />
            <input
              className="input"
              aria-label="Search ingredients"
              placeholder="Search ingredient or botanical name"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
            />
          </label>
          <select
            className="select toolbar-select"
            aria-label="Filter ingredients"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(0);
            }}
          >
            <option value="all">All ingredients</option>
            <option value="missing">Botanical name missing</option>
            <option value="aliases">Has remembered aliases</option>
          </select>
        </div>
        {filtered.length ? (
          <div
            className="table-frame"
            role="region"
            aria-label="Ingredient library table"
            tabIndex={0}
          >
            <table className="table">
              <thead>
                <tr>
                  <th>Canonical name</th>
                  <th>Botanical / plant part</th>
                  <th>Used in</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(page * 25, (page + 1) * 25).map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name}</strong>
                    </td>
                    <td>
                      <em>{row.botanical_name || "Not recorded"}</em>
                      <span className="sub">
                        {row.plant_part || "Plant part not recorded"}
                      </span>
                    </td>
                    <td>{row.used_in_products} product records</td>
                    <td>
                      <Status
                        tone={row.botanical_name ? "good" : "warn"}
                        icon={row.botanical_name ? "check" : "alert"}
                      >
                        {row.botanical_name ? "Reviewed" : "Botanical missing"}
                      </Status>
                      {row.alias_count > 0 && (
                        <span className="sub">
                          {row.alias_count} remembered aliases
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="table-action"
                        onClick={() => setEditing(row)}
                      >
                        Edit <Icon name="arrow-right" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No ingredients found">
            Try another search, or import a workbook to populate the ingredient
            library.
          </EmptyState>
        )}
        <div className="pagination">
          <span>
            {filtered.length
              ? `${page * 25 + 1}–${Math.min(
                  (page + 1) * 25,
                  filtered.length
                )} of ${filtered.length} ingredients`
              : "0 ingredients"}
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
      </Panel>
      <Notice title="Keep different materials separate" tone="info">
        Aliases are confirmed during workbook import. Amla and Amla Ghana are
        distinct materials; similarity alone must never merge them.
      </Notice>
      {editing && (
        <IngredientEditor
          ingredient={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setMessage("Ingredient details saved.");
            resource.reload();
          }}
        />
      )}
    </>
  );
}
function IngredientEditor({
  ingredient,
  onClose,
  onSaved,
}: {
  ingredient: IngredientMaster;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(ingredient.name);
  const [botanical, setBotanical] = useState(ingredient.botanical_name || "");
  const [part, setPart] = useState(ingredient.plant_part || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await transparencyApi.updateIngredient(ingredient.id, {
        name: name.trim(),
        botanical_name: botanical.trim() || null,
        plant_part: part.trim() || null,
      });
      onSaved();
    } catch (error) {
      setError(error as Error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Edit canonical ingredient" onClose={() => !busy && onClose()}>
      <form onSubmit={save}>
        <Notice
          title="Changes apply wherever this ingredient is used"
          tone="warn"
        >
          This may include published product records. Verify botanical names
          before saving.
        </Notice>
        <div className="section-stack">
          <label className="field">
            <span>Canonical name</span>
            <input
              className="input"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Botanical name</span>
            <input
              className="input"
              value={botanical}
              onChange={(event) => setBotanical(event.target.value)}
            />
          </label>
          {ingredient.botanical_suggestion && (
            <Notice title="Suggested botanical name" tone="info">
              <p>
                <em>{ingredient.botanical_suggestion}</em> · extracted from the
                source name, awaiting your review.
              </p>
              <Action
                onClick={() => setBotanical(ingredient.botanical_suggestion!)}
              >
                Use this suggestion
              </Action>
            </Notice>
          )}
          <label className="field">
            <span>Plant part</span>
            <input
              className="input"
              value={part}
              placeholder="For example, root or rhizome"
              onChange={(event) => setPart(event.target.value)}
            />
          </label>
        </div>
        {error && <ErrorNotice error={error} />}
        <div className="modal-actions">
          <Action disabled={busy} onClick={onClose}>
            Cancel
          </Action>
          <Action type="submit" tone="primary" disabled={busy || !name.trim()}>
            {busy ? "Saving…" : "Save ingredient"}
          </Action>
        </div>
      </form>
    </Modal>
  );
}
