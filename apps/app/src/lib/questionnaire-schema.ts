// Adapts the DB-backed schema (GET /api/v1/questionnaire/schema) into the
// FieldDef/StepDef shape the wizard/field-renderer already know how to render.
//
// This used to be ~840 lines of hardcoded FieldDef/StepDef exports (87 fields,
// 18 disease-condition step blocks) plus a `buildSteps()` that spliced
// DISEASE_STEPS entries into a fixed before/after step list based on the
// `chronic[]` checkbox. All of that content now lives in Postgres (see
// strengthiva-backend/app/models/app.py's QuestionStep/Question/QuestionOption
// and app/scripts/seed_questionnaire.py, which seeds the exact same 87 fields/
// 18 conditions this file used to hardcode) — an admin can add/edit/delete/
// reorder questions and even whole new disease-condition steps without a code
// change or deploy.
//
// The backend already returns steps ordered by order_index in the exact
// canonical sequence (fixed steps that come before any disease block, then
// the 18 disease-condition steps in their canonical order, then the fixed
// steps that come after) — so, unlike the old hardcoded version, there's no
// separate "before/after" grouping to reconstruct here: buildSteps() is just
// a visibility filter over one already-ordered list.

import type { QuestionnaireQuestionOut, QuestionnaireSchemaResponse, QuestionnaireStepOut } from "./api-client";
import type { Answers, FieldDef, StepDef } from "./questionnaire-types";
import type { Condition } from "./visibility-rules";
import { evaluateRule } from "./visibility-rules";

function toFieldDef(question: QuestionnaireQuestionOut): FieldDef {
  const rule = (question.visibility_rule as Condition | null) ?? undefined;
  return {
    id: question.field_key,
    label: question.label,
    type: question.field_type as FieldDef["type"],
    required: question.required,
    options: question.options,
    columns: (question.columns as 2 | 3 | null) ?? undefined,
    placeholder: question.placeholder ?? undefined,
    sublabel: question.sublabel ?? undefined,
    min: question.min ?? undefined,
    max: question.max ?? undefined,
    exclusiveValue: question.exclusive_value ?? undefined,
    visibleIf: rule ? (answers: Answers) => evaluateRule(rule, answers) : undefined,
  };
}

function toStepDef(step: QuestionnaireStepOut): StepDef {
  return {
    id: step.key,
    title: step.title,
    icon: step.icon,
    fields: step.questions.map(toFieldDef),
    visibilityRule: (step.visibility_rule as Condition | null) ?? undefined,
    bmiInsertBeforeFieldKey: step.bmi_insert_before_field_key ?? undefined,
  };
}

/** Adapts a freshly-fetched schema response into the wizard's step list, in order. */
export function adaptQuestionnaireSchema(schema: QuestionnaireSchemaResponse): StepDef[] {
  return schema.steps.map(toStepDef);
}

/**
 * Filters `allSteps` (already in canonical order) down to the steps that
 * should render given the current answers — a fixed step (no visibilityRule)
 * always passes; a conditionally-inserted step only passes when its rule
 * matches (e.g. the user checked the matching chronic[] box). Recomputed on
 * every answers change by the wizard so the step list grows/shrinks live as
 * chronic-condition checkboxes are toggled, with no added network round-trip.
 */
export function buildSteps(answers: Answers, allSteps: StepDef[]): StepDef[] {
  return allSteps.filter((step) => evaluateRule(step.visibilityRule, answers));
}
