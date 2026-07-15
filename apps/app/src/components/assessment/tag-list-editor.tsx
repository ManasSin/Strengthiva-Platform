"use client";

import { useState } from "react";

// Editable list of short text tags — used for the Review Extraction screen's
// symptoms/prescribed items (docs/platform-architecture/modules/app-frontend.md §3:
// "editable tags", "list, deletable").
export function TagListEditor({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const trimmed = draft.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setDraft("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
          >
            {value}
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => onChange(values.filter((v) => v !== value))}
              className="text-primary/60 hover:text-primary"
            >
              ×
            </button>
          </span>
        ))}
        {values.length === 0 && <span className="text-sm italic text-muted-foreground">None yet</span>}
      </div>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commitDraft();
          }
        }}
        onBlur={commitDraft}
        placeholder={placeholder}
        className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );
}
