// Shared types for the health assessment wizard's data-driven schema. The
// schema itself is now fetched from FastAPI (GET /api/v1/questionnaire/schema)
// and adapted into these shapes by src/lib/questionnaire-schema.ts — see that
// file, strengthiva-backend/app/models/app.py's QuestionStep/Question, and
// docs/platform-architecture/tech-specs/backend/health-assessment-and-reports.md.

import type { Condition } from "./visibility-rules";

export type Answers = Record<string, string | string[] | undefined>;

export type FieldType = "text" | "number" | "radio" | "checkbox-group" | "select" | "slider" | "textarea";

export type FieldOption = {
  value: string;
  label: string;
};

export type FieldDef = {
  id: string; // matches the `answers` key expected by FastAPI's profile_builder.py
  label: string;
  type: FieldType;
  required?: boolean;
  options?: FieldOption[];
  columns?: 2 | 3;
  placeholder?: string;
  sublabel?: string;
  min?: number;
  max?: number;
  // Field only renders/counts toward validation when this returns true —
  // built by questionnaire-schema.ts from the question's `visibility_rule`
  // (see visibility-rules.ts's evaluateRule) rather than hand-written per
  // field, as it used to be.
  visibleIf?: (answers: Answers) => boolean;
  // Generalizes the old chronic[]-only "None" mutual-exclusivity special
  // case: selecting the option whose value matches this clears every other
  // selection in the same checkbox-group, and vice versa. Only meaningful for
  // type: "checkbox-group". Sourced from the question's `exclusive_value` —
  // seeded only on chronic[] today (see seed_questionnaire.py) — deliberately
  // NOT inferred from any option merely being labeled "None".
  exclusiveValue?: string;
};

export type StepDef = {
  id: string;
  title: string;
  icon: string;
  fields: FieldDef[];
  // Only set for a conditionally-inserted step (was: a hardcoded DISEASE_STEPS
  // entry) — evaluated against the current answers to decide whether this step
  // appears in the wizard at all. Undefined means "always show" (a fixed step).
  visibilityRule?: Condition;
  // Only set on the one step containing the BMI composite field — the wizard
  // renders BMI immediately before the question with this field_key, falling
  // back to rendering BMI first in the step if that question is missing
  // (e.g. deleted by an admin).
  bmiInsertBeforeFieldKey?: string;
};
