"use client";
import { useState } from "react";
import type {
  ImportPreview,
  NameDecision,
  UnresolvedName,
} from "@strengthiva/transparency/types";
import { decisionFor, safeSuggestion } from "@strengthiva/transparency/domain";
import { Icon, Notice, Panel, Status } from "@strengthiva/transparency/ui";
import { Action } from "./controls";
export type Decisions = Record<string, NameDecision>;
export const decisionKey = (name: UnresolvedName) => `${name.kind}:${name.key}`;
export function Matching({
  preview,
  decisions,
  onChange,
  disabled,
}: {
  preview: ImportPreview;
  decisions: Decisions;
  onChange: (value: Decisions) => void;
  disabled: boolean;
}) {
  const remaining = preview.unresolved.filter(
    (name) => !decisions[decisionKey(name)]
  );
  const safe = remaining.filter(
    (name) => name.suggestions[0] && safeSuggestion(name.suggestions[0])
  );
  const [history, setHistory] = useState<string[]>([]);
  function decide(name: UnresolvedName, decision: NameDecision) {
    const key = decisionKey(name);
    setHistory((current) => [...current, key]);
    onChange({ ...decisions, [key]: decision });
  }
  function acceptSafe() {
    const next = { ...decisions };
    for (const name of safe)
      next[decisionKey(name)] = decisionFor(name.key, name.suggestions[0]);
    setHistory((current) => [...current, ...safe.map(decisionKey)]);
    onChange(next);
  }
  function undo() {
    const key = history[history.length - 1];
    if (!key) return;
    const next = { ...decisions };
    delete next[key];
    setHistory((current) => current.slice(0, -1));
    onChange(next);
  }
  return (
    <div className="split">
      <div className="section-stack">
        <Panel
          title="Resolve source names"
          copy="Review each proposed match. Confirmed spellings will be remembered on your next import."
          actions={<Status tone="info">{remaining.length} remaining</Status>}
        >
          <div className="toolbar">
            <Action disabled={disabled || !safe.length} onClick={acceptSafe}>
              <Icon name="check" />
              Accept {safe.length} exact plant-part expansions
            </Action>
            <Action disabled={disabled || !history.length} onClick={undo}>
              Undo last decision
            </Action>
          </div>
          {remaining.length ? (
            <MatchCard
              key={decisionKey(remaining[0])}
              name={remaining[0]}
              disabled={disabled}
              onDecide={(decision) => decide(remaining[0], decision)}
            />
          ) : (
            <Notice title="Every suggested name has been reviewed" tone="good">
              Your decisions will be applied when you import the draft records.
            </Notice>
          )}
        </Panel>
        <Panel title="Decision register">
          {preview.unresolved.length ? (
            <div className="decision-register">
              {preview.unresolved.map((name) => {
                const decision = decisions[decisionKey(name)];
                return (
                  <div className="decision-row" key={decisionKey(name)}>
                    <div>
                      <strong>{name.raw}</strong>
                      <span>
                        {decision
                          ? decision.action === "create"
                            ? "Keep as a separate material"
                            : `Link to ${
                                decision.target_name ||
                                name.suggestions.find(
                                  (s) => s.id === decision.target_id
                                )?.name ||
                                "selected record"
                              }`
                          : `${name.occurrences} uses · awaiting review`}
                      </span>
                    </div>
                    <Status
                      tone={decision ? "good" : "warn"}
                      icon={decision ? "check" : "alert"}
                    >
                      {decision ? "Reviewed" : "Pending"}
                    </Status>
                    {decision && (
                      <button
                        type="button"
                        className="text-btn"
                        disabled={disabled}
                        onClick={() => {
                          const next = { ...decisions };
                          delete next[decisionKey(name)];
                          onChange(next);
                        }}
                      >
                        Change
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted">No suggested matches need review.</p>
          )}
        </Panel>
      </div>
      <aside className="section-stack">
        <Panel title="Import progress">
          <div className="readiness-count">
            <strong>
              {preview.unresolved.length - remaining.length}
              <span> / {preview.unresolved.length}</span>
            </strong>
            <p>name decisions reviewed</p>
          </div>
          <progress
            className="progress"
            max={Math.max(1, preview.unresolved.length)}
            value={preview.unresolved.length - remaining.length}
            aria-label="Name review progress"
          />
          <div className="scope-note">
            <Icon name="refresh" />
            <span>
              Every confirmed alias saves a decision the next time this spelling
              appears.
            </span>
          </div>
        </Panel>
        <Notice title="Similar names can be different materials" tone="warn">
          <p>
            Amla and Amla Ghana are distinct materials. Check every difference
            in plant part, extract, or formulation before linking.
          </p>
        </Notice>
        <Notice title="You can finish later" tone="info">
          Names left unreviewed will be created as separate entries. Every row
          is preserved; records remain drafts.
        </Notice>
      </aside>
    </div>
  );
}
function MatchCard({
  name,
  onDecide,
  disabled,
}: {
  name: UnresolvedName;
  onDecide: (decision: NameDecision) => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState(
    name.suggestions[0] && safeSuggestion(name.suggestions[0]) ? "0" : ""
  );
  return (
    <form
      className="match-triage"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled && selected !== "")
          onDecide(decisionFor(name.key, name.suggestions[Number(selected)]));
      }}
    >
      <div className="eyebrow">
        {name.kind} · {name.occurrences} uses in this workbook
      </div>
      <h3>{name.raw}</h3>
      <label className="field">
        <span>Suggested canonical name</span>
        <select
          className="select"
          value={selected}
          disabled={disabled}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">Choose after reviewing the difference</option>
          {name.suggestions.map((suggestion, index) => (
            <option key={index} value={index}>
              {suggestion.name}
            </option>
          ))}
        </select>
      </label>
      <div className="candidate-list">
        {name.suggestions.map((suggestion, index) => (
          <label
            className={`candidate ${
              safeSuggestion(suggestion) ? "safe" : "review"
            }`}
            key={index}
          >
            <input
              type="radio"
              name="candidate"
              checked={selected === String(index)}
              disabled={disabled}
              onChange={() => setSelected(String(index))}
            />
            <span>
              <strong>{suggestion.name}</strong>
              <span>{suggestion.reason}</span>
            </span>
            <Status tone={safeSuggestion(suggestion) ? "good" : "warn"}>
              {safeSuggestion(suggestion)
                ? "Same material spelling"
                : "Review difference"}
            </Status>
          </label>
        ))}
      </div>
      <div className="match-actions">
        <Action
          tone="primary"
          type="submit"
          disabled={disabled || selected === ""}
        >
          <Icon name="check" />
          Accept selected match
        </Action>
        <Action
          disabled={disabled}
          onClick={() => onDecide({ key: name.key, action: "create" })}
        >
          Keep separate
        </Action>
      </div>
      <p className="tiny muted">
        Select a candidate, then press Enter to accept it. Nothing is merged
        until you import the drafts.
      </p>
    </form>
  );
}
