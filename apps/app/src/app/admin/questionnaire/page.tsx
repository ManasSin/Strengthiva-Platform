"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api, ApiError, type AdminStep, type StepCreatePayload } from "@/lib/api-client";
import { Icon } from "@strengthiva/transparency/ui";

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

  if (!steps) return <div className="px-4 py-10 text-sm text-muted-foreground">Loading questionnaire…</div>;

  const orderedSteps = [...steps].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 py-2 sm:py-6">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="max-w-3xl">
          <h1 className="font-display text-title text-foreground">Questionnaire</h1>
          <p className="mt-3 text-[0.98rem] leading-7 text-muted-foreground">
            Arrange the health-assessment journey. Condition-specific steps appear only when the matching chronic condition is selected.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateForm((value) => !value)}>
          <Icon name={showCreateForm ? "x" : "plus"} className="size-4" />
          {showCreateForm ? "Cancel" : "New step"}
        </Button>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

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

      <section className="overflow-hidden rounded-2xl border border-border bg-background" aria-labelledby="questionnaire-steps-title">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-5 sm:px-7">
          <div>
            <h2 id="questionnaire-steps-title" className="font-display text-heading text-foreground">Assessment steps</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use the arrows to set the order people see.</p>
          </div>
          <span className="text-sm text-muted-foreground">{orderedSteps.length} steps</span>
        </div>
        {orderedSteps.map((step, i) => (
          <article
            key={step.id}
            className={`flex flex-col gap-4 border-b border-border px-5 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-7 ${
              step.active ? "" : "bg-surface/70"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-foreground">
                <Icon name={step.step_type === "disease_block" ? "flask" : "file"} className="size-5" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <span className="rounded-full bg-surface px-2.5 py-1 text-xs text-muted-foreground">
                    {step.step_type === "disease_block" ? "Condition step" : "Standard step"}
                  </span>
                  {!step.active && <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs text-destructive">Hidden</span>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.questions.filter((question) => question.active).length} active questions · {step.key}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="icon-xs"
                disabled={busy || i === 0}
                aria-label={`Move ${step.title} up`}
                onClick={() => move(step, -1)}
              >
                <Icon name="arrow-right" className="size-3.5 -rotate-90" />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                disabled={busy || i === orderedSteps.length - 1}
                aria-label={`Move ${step.title} down`}
                onClick={() => move(step, 1)}
              >
                <Icon name="arrow-right" className="size-3.5 rotate-90" />
              </Button>
              <Link href={`/admin/questionnaire/${step.id}`} className="rounded-lg px-2 py-2 text-sm font-medium text-primary underline decoration-primary/50 underline-offset-4 transition-colors hover:text-foreground">
                Edit
              </Link>
              <Button
                variant="ghost"
                size="xs"
                disabled={busy}
                onClick={() => toggleActive(step)}
              >
                {step.active ? "Hide" : "Unhide"}
              </Button>
            </div>
          </article>
        ))}
      </section>
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
                Every existing &quot;Chronic conditions&quot; option is already used by another step — add a new option to
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
