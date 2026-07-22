"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  api,
  ApiError,
  type AdminQuestion,
  type AdminStep,
  type QuestionCreatePayload,
} from "@/lib/api-client";
import { VisibilityRuleEditor } from "@/components/admin/visibility-rule-editor";

const FIELD_TYPES = ["text", "number", "radio", "checkbox-group", "select", "slider", "textarea"];

export default function StepEditorPage() {
  const { stepId } = useParams<{ stepId: string }>();
  const [allSteps, setAllSteps] = useState<AdminStep[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  async function load() {
    try {
      setError(null);
      const { steps } = await api.getAdminQuestionnaireSteps();
      setAllSteps(steps);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load the questionnaire schema.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!allSteps) return <div className="text-sm text-gray-500">Loading…</div>;

  const step = allSteps.find((s) => s.id === stepId);
  if (!step) return <div className="text-sm text-red-600">Step not found.</div>;

  const knownFieldKeys = allSteps.flatMap((s) => s.questions).map((q) => q.field_key);
  const orderedQuestions = [...step.questions].sort((a, b) => a.order_index - b.order_index);

  async function withBusy(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function moveQuestion(question: AdminQuestion, direction: -1 | 1) {
    const ordered = [...step!.questions].sort((a, b) => a.order_index - b.order_index);
    const index = ordered.findIndex((q) => q.id === question.id);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= ordered.length) return;
    [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];
    await withBusy(() => api.reorderQuestions(step!.id, ordered.map((q) => q.id)));
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Link href="/admin/questionnaire" className="text-sm text-primary underline">
        ← All steps
      </Link>

      <StepMetadataEditor
        step={step}
        knownFieldKeys={knownFieldKeys}
        onSave={(patch) => withBusy(() => api.updateStep(step.id, patch))}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Questions</h2>
        <button
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white"
          onClick={() => setShowAddQuestion((v) => !v)}
        >
          {showAddQuestion ? "Cancel" : "+ Add question"}
        </button>
      </div>

      {showAddQuestion && (
        <AddQuestionForm
          stepId={step.id}
          onCreated={() => {
            setShowAddQuestion(false);
            load();
          }}
          onError={setError}
        />
      )}

      <div className="flex flex-col gap-y-2">
        {orderedQuestions.map((question, i) => (
          <QuestionRow
            key={question.id}
            question={question}
            knownFieldKeys={knownFieldKeys}
            busy={busy}
            isFirst={i === 0}
            isLast={i === orderedQuestions.length - 1}
            onMove={(dir) => moveQuestion(question, dir)}
            onUpdate={(patch) => withBusy(() => api.updateQuestion(question.id, patch))}
            onDelete={() => withBusy(() => api.deleteQuestion(question.id))}
            onReload={load}
            onError={setError}
          />
        ))}
      </div>
    </div>
  );
}

function StepMetadataEditor({
  step,
  knownFieldKeys,
  onSave,
}: {
  step: AdminStep;
  knownFieldKeys: string[];
  onSave: (patch: Partial<AdminStep>) => void;
}) {
  const [title, setTitle] = useState(step.title);
  const [icon, setIcon] = useState(step.icon);
  const [bmiAnchor, setBmiAnchor] = useState(step.bmi_insert_before_field_key ?? "");
  const [promptSection, setPromptSection] = useState(step.prompt_section ?? "");
  const [includeInPrompt, setIncludeInPrompt] = useState(step.include_in_prompt);
  const [rule, setRule] = useState(step.visibility_rule);

  const dirty =
    title !== step.title ||
    icon !== step.icon ||
    bmiAnchor !== (step.bmi_insert_before_field_key ?? "") ||
    promptSection !== (step.prompt_section ?? "") ||
    includeInPrompt !== step.include_in_prompt ||
    JSON.stringify(rule) !== JSON.stringify(step.visibility_rule);

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-2 text-xs text-gray-400">
        key: {step.key} (immutable) · type: {step.step_type} (immutable)
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-gray-500">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-gray-500">
          Icon
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-gray-500">
          BMI composite renders before this field_key (only set this on one step — leave blank otherwise)
          <input
            value={bmiAnchor}
            onChange={(e) => setBmiAnchor(e.target.value)}
            placeholder="e.g. occupation"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
        {step.step_type === "disease_block" && (
          <>
            <label className="text-xs text-gray-500">
              AI prompt section header
              <input
                value={promptSection}
                onChange={(e) => setPromptSection(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={includeInPrompt}
                onChange={(e) => setIncludeInPrompt(e.target.checked)}
              />
              Include this step&apos;s answers in the AI prompt (off = renders in wizard but never reaches the AI)
            </label>
          </>
        )}
      </div>
      <div className="mt-2">
        <span className="text-xs text-gray-500">
          {step.step_type === "disease_block" ? "Trigger condition (when this step appears in the wizard)" : "Visibility rule"}
        </span>
        <VisibilityRuleEditor value={rule} onChange={setRule} knownFieldKeys={knownFieldKeys} />
      </div>
      <button
        disabled={!dirty}
        className="mt-3 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        onClick={() =>
          onSave({
            title,
            icon,
            bmi_insert_before_field_key: bmiAnchor || null,
            prompt_section: promptSection || null,
            include_in_prompt: includeInPrompt,
            visibility_rule: rule,
          })
        }
      >
        Save step
      </button>
    </div>
  );
}

function QuestionRow({
  question,
  knownFieldKeys,
  busy,
  isFirst,
  isLast,
  onMove,
  onUpdate,
  onDelete,
  onReload,
  onError,
}: {
  question: AdminQuestion;
  knownFieldKeys: string[];
  busy: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onUpdate: (patch: Partial<AdminQuestion>) => void;
  onDelete: () => void;
  onReload: () => void;
  onError: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [label, setLabel] = useState(question.label);
  const [sublabel, setSublabel] = useState(question.sublabel ?? "");
  const [placeholder, setPlaceholder] = useState(question.placeholder ?? "");
  const [fieldType, setFieldType] = useState(question.field_type);
  const [required, setRequired] = useState(question.required);
  const [columns, setColumns] = useState(question.columns?.toString() ?? "");
  const [min, setMin] = useState(question.min?.toString() ?? "");
  const [max, setMax] = useState(question.max?.toString() ?? "");
  const [promptLabel, setPromptLabel] = useState(question.prompt_label ?? "");
  const [exclusiveValue, setExclusiveValue] = useState(question.exclusive_value ?? "");
  const [rule, setRule] = useState(question.visibility_rule);

  const hasOptions = ["radio", "select", "checkbox-group"].includes(fieldType);

  function save() {
    onUpdate({
      label,
      sublabel: sublabel || null,
      placeholder: placeholder || null,
      field_type: fieldType,
      required,
      columns: columns ? Number(columns) : null,
      min: min ? Number(min) : null,
      max: max ? Number(max) : null,
      prompt_label: promptLabel || null,
      exclusive_value: exclusiveValue || null,
      visibility_rule: rule,
    });
  }

  return (
    <div className={`rounded-lg border bg-white p-3 ${!question.active ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <button className="flex-1 text-left" onClick={() => setExpanded((v) => !v)}>
          <span className="font-medium">{question.label}</span>{" "}
          <span className="text-xs text-gray-400">
            {question.field_key} · {question.field_type}
            {question.required && " · required"}
            {question.is_protected && " · protected"}
            {!question.active && " · hidden"}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button disabled={busy || isFirst} className="text-sm disabled:opacity-30" onClick={() => onMove(-1)}>
            ↑
          </button>
          <button disabled={busy || isLast} className="text-sm disabled:opacity-30" onClick={() => onMove(1)}>
            ↓
          </button>
          <button
            disabled={busy || question.is_protected}
            title={question.is_protected ? "Protected — used by server-side gender/chronic-condition logic" : ""}
            className="text-sm text-red-600 underline disabled:cursor-not-allowed disabled:text-gray-300"
            onClick={() => {
              if (window.confirm(`Hide "${question.label}"? It will no longer appear in the wizard.`)) onDelete();
            }}
          >
            {question.active ? "Hide" : "Unhide"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-y-3 border-t pt-3">
          <div className="text-xs text-gray-400">field_key: {question.field_key} (immutable)</div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-500">
              Label
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-gray-500">
              Sublabel
              <input
                value={sublabel}
                onChange={(e) => setSublabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-gray-500">
              Type
              <select
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-gray-500">
              Placeholder
              <input
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              Required
            </label>
            <label className="text-xs text-gray-500">
              Columns (radio/checkbox layout — 2 or 3)
              <input
                value={columns}
                onChange={(e) => setColumns(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </label>
            {(fieldType === "number" || fieldType === "slider") && (
              <>
                <label className="text-xs text-gray-500">
                  Min
                  <input
                    value={min}
                    onChange={(e) => setMin(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-gray-500">
                  Max
                  <input
                    value={max}
                    onChange={(e) => setMax(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </label>
              </>
            )}
            <label className="text-xs text-gray-500">
              AI prompt label (disease-block questions only — defaults to Label)
              <input
                value={promptLabel}
                onChange={(e) => setPromptLabel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </label>
            {fieldType === "checkbox-group" && (
              <label className="text-xs text-gray-500">
                Exclusive option value (selecting it clears every other selection, e.g. "None")
                <input
                  value={exclusiveValue}
                  onChange={(e) => setExclusiveValue(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </label>
            )}
          </div>

          <div>
            <span className="text-xs text-gray-500">Visibility rule</span>
            <VisibilityRuleEditor value={rule} onChange={setRule} knownFieldKeys={knownFieldKeys} />
          </div>

          <div>
            <button
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white"
              onClick={save}
            >
              Save question
            </button>
          </div>

          {hasOptions && (
            <OptionsEditor question={question} onReload={onReload} onError={onError} />
          )}
        </div>
      )}
    </div>
  );
}

function OptionsEditor({
  question,
  onReload,
  onError,
}: {
  question: AdminQuestion;
  onReload: () => void;
  onError: (msg: string) => void;
}) {
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const orderedOptions = [...question.options].sort((a, b) => a.order_index - b.order_index);

  async function withBusy(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      onReload();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "That action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function move(optionId: string, direction: -1 | 1) {
    const index = orderedOptions.findIndex((o) => o.id === optionId);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= orderedOptions.length) return;
    const reordered = [...orderedOptions];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
    await withBusy(() => api.reorderOptions(question.id, reordered.map((o) => o.id)));
  }

  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="mb-2 text-xs font-medium text-gray-500">Options</div>
      <div className="flex flex-col gap-y-1">
        {orderedOptions.map((option, i) => (
          <div key={option.id} className={`flex items-center gap-2 ${!option.active ? "opacity-50" : ""}`}>
            <input
              defaultValue={option.label}
              onBlur={(e) => {
                if (e.target.value !== option.label) {
                  withBusy(() => api.updateOption(option.id, { label: e.target.value }));
                }
              }}
              className="w-48 rounded border border-border px-2 py-1 text-xs"
            />
            <span className="text-xs text-gray-400">value: {option.value}</span>
            <button disabled={busy || i === 0} className="text-xs disabled:opacity-30" onClick={() => move(option.id, -1)}>
              ↑
            </button>
            <button
              disabled={busy || i === orderedOptions.length - 1}
              className="text-xs disabled:opacity-30"
              onClick={() => move(option.id, 1)}
            >
              ↓
            </button>
            <button
              disabled={busy}
              className="text-xs text-red-600 underline"
              onClick={() =>
                withBusy(() => (option.active ? api.deleteOption(option.id) : api.updateOption(option.id, { active: true })))
              }
            >
              {option.active ? "Hide" : "Unhide"}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="value (stored in answers)"
          className="w-40 rounded border border-border px-2 py-1 text-xs"
        />
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="label (shown to user)"
          className="w-40 rounded border border-border px-2 py-1 text-xs"
        />
        <button
          disabled={busy || !newValue || !newLabel}
          className="rounded bg-primary px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
          onClick={() =>
            withBusy(async () => {
              await api.createOption(question.id, { value: newValue, label: newLabel });
              setNewValue("");
              setNewLabel("");
            })
          }
        >
          + Add option
        </button>
      </div>
    </div>
  );
}

function AddQuestionForm({
  stepId,
  onCreated,
  onError,
}: {
  stepId: string;
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [fieldKey, setFieldKey] = useState("");
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [required, setRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const payload: QuestionCreatePayload = { step_id: stepId, field_key: fieldKey, label, field_type: fieldType, required };
      await api.createQuestion(payload);
      onCreated();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to create the question.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
      <label className="text-xs text-gray-500">
        field_key (stable, e.g. my-new-field)
        <input
          value={fieldKey}
          onChange={(e) => setFieldKey(e.target.value)}
          className="mt-1 w-48 rounded-lg border border-border px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs text-gray-500">
        Label
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="mt-1 w-48 rounded-lg border border-border px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs text-gray-500">
        Type
        <select
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value)}
          className="mt-1 rounded-lg border border-border px-3 py-2 text-sm"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 pb-2 text-xs text-gray-500">
        <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
        Required
      </label>
      <button
        disabled={submitting || !fieldKey || !label}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        onClick={submit}
      >
        {submitting ? "Creating…" : "Create question"}
      </button>
      <p className="w-full text-xs text-gray-400">
        Options for radio/select/checkbox-group fields can be added after creating the question (expand it below).
      </p>
    </div>
  );
}
