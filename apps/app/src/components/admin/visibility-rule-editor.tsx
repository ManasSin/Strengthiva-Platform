"use client";

import { useState } from "react";

// Edits a Question/QuestionStep `visibility_rule` — the JSON shape
// strengthiva-backend stores and apps/app/src/lib/visibility-rules.ts
// interprets: a single condition ({field,op,value}) or an {all:[...]} /
// {any:[...]} group. Covers the common single-condition case with plain
// dropdowns; anything more complex (an admin composing an all/any group) drops
// into a raw-JSON textarea instead of a bespoke recursive rule-tree UI — the
// only rules ever seeded so far are single conditions or a 2-condition "all",
// so a full visual nested-rule builder isn't warranted yet (see the design
// review this was scoped from).

type Rule = Record<string, unknown> | null;

const OPS = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "is answered and not equal to" },
  { value: "in", label: "is one of (comma-separated)" },
  { value: "includes", label: "includes (checkbox-group contains)" },
  { value: "not_includes", label: "does not include (checkbox-group)" },
];

function isSimpleCondition(rule: Rule): rule is { field: string; op: string; value: unknown } {
  return !!rule && typeof rule === "object" && "field" in rule && "op" in rule;
}

export function VisibilityRuleEditor({
  value,
  onChange,
  knownFieldKeys,
}: {
  value: Rule;
  onChange: (rule: Rule) => void;
  knownFieldKeys: string[];
}) {
  const [advancedMode, setAdvancedMode] = useState(!!value && !isSimpleCondition(value));
  const [jsonDraft, setJsonDraft] = useState(value ? JSON.stringify(value, null, 2) : "");
  const [jsonError, setJsonError] = useState<string | null>(null);

  if (advancedMode) {
    return (
      <div className="mt-2">
        <textarea
          value={jsonDraft}
          onChange={(e) => {
            setJsonDraft(e.target.value);
            if (!e.target.value.trim()) {
              setJsonError(null);
              onChange(null);
              return;
            }
            try {
              onChange(JSON.parse(e.target.value));
              setJsonError(null);
            } catch {
              setJsonError("Invalid JSON — not saved until this parses.");
            }
          }}
          rows={5}
          placeholder='{"all": [{"field": "gender", "op": "eq", "value": "Female"}]} — leave blank for "always show"'
          className="w-full rounded-lg border border-border px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none"
        />
        {jsonError && <p className="mt-1 text-xs text-red-600">{jsonError}</p>}
        <button
          type="button"
          className="mt-1 text-xs text-primary underline"
          onClick={() => {
            setAdvancedMode(false);
            setJsonError(null);
          }}
        >
          Switch to simple mode (loses anything but a single condition)
        </button>
      </div>
    );
  }

  const simple = isSimpleCondition(value) ? value : null;
  const field = simple?.field ?? "";
  const op = simple?.op ?? "eq";
  const rawValue = simple?.value;
  const valueText = Array.isArray(rawValue) ? rawValue.join(", ") : ((rawValue as string) ?? "");

  function update(nextField: string, nextOp: string, nextValueText: string) {
    if (!nextField) {
      onChange(null);
      return;
    }
    const nextValue = nextOp === "in" ? nextValueText.split(",").map((s) => s.trim()).filter(Boolean) : nextValueText;
    onChange({ field: nextField, op: nextOp, value: nextValue });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Show only when</span>
      <input
        list="visibility-rule-field-keys"
        value={field}
        onChange={(e) => update(e.target.value, op, valueText)}
        placeholder="field_key (e.g. gender)"
        className="w-40 rounded-lg border border-border px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
      />
      <datalist id="visibility-rule-field-keys">
        {knownFieldKeys.map((k) => (
          <option key={k} value={k} />
        ))}
      </datalist>
      <select
        value={op}
        onChange={(e) => update(field, e.target.value, valueText)}
        className="rounded-lg border border-border px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
      >
        {OPS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <input
        value={valueText}
        onChange={(e) => update(field, op, e.target.value)}
        placeholder={op === "in" ? "Value A, Value B" : "value"}
        className="w-40 rounded-lg border border-border px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
      />
      {value && (
        <button type="button" className="text-xs text-red-600 underline" onClick={() => onChange(null)}>
          Clear (always show)
        </button>
      )}
      <button
        type="button"
        className="text-xs text-primary underline"
        onClick={() => {
          setJsonDraft(value ? JSON.stringify(value, null, 2) : "");
          setAdvancedMode(true);
        }}
      >
        Advanced (JSON / all-of / any-of)
      </button>
    </div>
  );
}
