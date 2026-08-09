"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, type AdminStep, type StepCreatePayload } from "@/lib/api-client";

// Admin questionnaire schema management — the DB-backed replacement for
// strengthiva-platform's old hardcoded questionnaire-schema.ts (see that
// file's module docstring and strengthiva-backend/app/scripts/
// seed_questionnaire.py). Lists all steps (fixed + disease-condition blocks),
// lets an admin reorder/activate-deactivate them and create new ones —
// including brand-new disease-condition blocks, since the backend already
// treats "fixed" and "disease_block" steps identically once created.
//
// Same conventions as the other two admin pages (knowledge-base,
// batch-certificates): client-side load/mutate/refetch, flat error banner, no
// table/dialog library, hand-rolled Tailwind.
export default function AdminQuestionnairePage() {
  const [steps, setSteps] = useState<AdminStep[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setError(null);
      const { steps } = await api.getAdminQuestionnaireSteps();
      setSteps(steps);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load the questionnaire schema.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function move(step: AdminStep, direction: -1 | 1) {
    if (!steps) return;
    const ordered = [...steps].sort((a, b) => a.order_index - b.order_index);
    const index = ordered.findIndex((s) => s.id === step.id);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= ordered.length) return;
    [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];
    setBusy(true);
    try {
      await api.reorderSteps(ordered.map((s) => s.id));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reorder steps.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(step: AdminStep) {
    setBusy(true);
    try {
      if (step.active) {
        await api.deleteStep(step.id); // soft-delete (active=false)
      } else {
        await api.updateStep(step.id, { active: true });
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update the step.");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!steps) return <div className="text-sm text-gray-500">Loading…</div>;

  const orderedSteps = [...steps].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Questionnaire</h1>
          <p className="mt-1 text-sm text-gray-500">
            Steps in the health-assessment wizard. Disease-condition steps only appear when the matching
            chronic-condition checkbox is selected.
          </p>
        </div>
        <button
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          onClick={() => setShowCreateForm((v) => !v)}
        >
          {showCreateForm ? "Cancel" : "+ New step"}
        </button>
      </div>

      {showCreateForm && (
        <CreateStepForm
          steps={steps}
          onCreated={() => {
            setShowCreateForm(false);
            load();
          }}
          onError={(msg) => setError(msg)}
        />
      )}

      <div className="flex flex-col gap-y-2">
        {orderedSteps.map((step, i) => (
          <div
            key={step.id}
            className={`flex items-center justify-between rounded-lg border bg-background p-4 ${!step.active ? "opacity-50" : ""}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{step.icon}</span>
              <div>
                <div className="font-medium">
                  {step.title}{" "}
                  <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                    {step.step_type}
                  </span>
                  {!step.active && <span className="ml-1 text-xs text-red-500">(hidden)</span>}
                </div>
                <div className="text-xs text-gray-400">
                  key: {step.key} · {step.questions.filter((q) => q.active).length} active questions
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button disabled={busy || i === 0} className="text-sm disabled:opacity-30" onClick={() => move(step, -1)}>
                ↑
              </button>
              <button
                disabled={busy || i === orderedSteps.length - 1}
                className="text-sm disabled:opacity-30"
                onClick={() => move(step, 1)}
              >
                ↓
              </button>
              <Link href={`/admin/questionnaire/${step.id}`} className="text-sm text-primary underline">
                Edit
              </Link>
              <button
                disabled={busy}
                className="text-sm text-gray-500 underline disabled:opacity-30"
                onClick={() => toggleActive(step)}
              >
                {step.active ? "Hide" : "Unhide"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateStepForm({
  steps,
  onCreated,
  onError,
}: {
  steps: AdminStep[];
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("✨");
  const [stepType, setStepType] = useState<"fixed" | "disease_block">("fixed");
  const [promptSection, setPromptSection] = useState("");
  const [triggerValue, setTriggerValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const chronicQuestion = steps.flatMap((s) => s.questions).find((q) => q.field_key === "chronic[]");
  const usedTriggerValues = new Set(
    steps
      .filter((s) => s.step_type === "disease_block" && s.visibility_rule?.op === "includes")
      .map((s) => String(s.visibility_rule!.value)),
  );
  const availableConditions = (chronicQuestion?.options ?? []).filter(
    (o) => o.value !== "None" && !usedTriggerValues.has(o.value),
  );

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload: StepCreatePayload = {
        key,
        title,
        icon,
        step_type: stepType,
        ...(stepType === "disease_block"
          ? {
              prompt_section: promptSection || `${title.toUpperCase()} DETAILS`,
              include_in_prompt: true,
              visibility_rule: { field: "chronic[]", op: "includes", value: triggerValue },
            }
          : {}),
      };
      await api.createStep(payload);
      onCreated();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Failed to create the step.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-y-3 rounded-lg border bg-background p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-gray-500">
          Key (stable id, e.g. disease-migraine)
          <input
            required
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-gray-500">
          Title
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-gray-500">
          Icon (emoji)
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-gray-500">
          Step type
          <select
            value={stepType}
            onChange={(e) => setStepType(e.target.value as "fixed" | "disease_block")}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value="fixed">Fixed (always shown)</option>
            <option value="disease_block">Disease condition (conditionally shown)</option>
          </select>
        </label>
      </div>

      {stepType === "disease_block" && (
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-primary/5 p-3">
          <label className="text-xs text-gray-500">
            Triggering chronic condition
            {availableConditions.length === 0 ? (
              <p className="mt-1 text-xs text-red-600">
                Every existing "Chronic conditions" option is already used by another step — add a new option to
                that question first (see its editor).
              </p>
            ) : (
              <select
                required
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="">Select…</option>
                {availableConditions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label className="text-xs text-gray-500">
            AI prompt section header (optional — defaults to &quot;{title.toUpperCase() || "…"} DETAILS&quot;)
            <input
              value={promptSection}
              onChange={(e) => setPromptSection(e.target.value)}
              placeholder={`${title.toUpperCase() || "…"} DETAILS`}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </label>
        </div>
      )}

      <div>
        <button
          type="button"
          disabled={submitting || !key || !title || (stepType === "disease_block" && !triggerValue)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={handleSubmit}
        >
          {submitting ? "Creating…" : "Create step"}
        </button>
      </div>
    </div>
  );
}
