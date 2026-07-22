// Declarative replacement for the old per-field `visibleIf: (answers) => boolean`
// closures that used to be hand-written in questionnaire-schema.ts — lets the
// backend (and eventually an admin UI) define conditional visibility as data.
// See strengthiva-backend/app/models/app.py's Question/QuestionStep
// `visibility_rule` JSONB column for the source of truth this shape mirrors.

import type { Answers } from "./questionnaire-types";

export type FieldCondition =
  | { field: string; op: "eq" | "neq" | "includes" | "not_includes"; value: string }
  | { field: string; op: "in"; value: string[] };

export type AllCondition = { all: Condition[] };
export type AnyCondition = { any: Condition[] };

export type Condition = FieldCondition | AllCondition | AnyCondition;

function isAnswered(value: string | string[] | undefined): boolean {
  return value !== undefined && value !== null && value !== "";
}

function evaluateCondition(condition: Condition, answers: Answers): boolean {
  if ("all" in condition) return condition.all.every((c) => evaluateCondition(c, answers));
  if ("any" in condition) return condition.any.some((c) => evaluateCondition(c, answers));

  const value = answers[condition.field];
  switch (condition.op) {
    case "eq":
      return value === condition.value;
    case "neq":
      // "answered AND not equal" — matches every legacy visibleIf closure's
      // actual semantics (e.g. the old substance[] check was
      // `a["consume-alcohol"] !== undefined && a["consume-alcohol"] !== "Not
      // applicable"`, never a bare !==), verified against all 8 instances in
      // the old questionnaire-schema.ts before this rewrite.
      return isAnswered(value) && value !== condition.value;
    case "in":
      return typeof value === "string" && condition.value.includes(value);
    case "includes":
      return Array.isArray(value) && value.includes(condition.value);
    case "not_includes":
      return !Array.isArray(value) || !value.includes(condition.value);
    default:
      return true;
  }
}

export function evaluateRule(rule: Condition | undefined, answers: Answers): boolean {
  if (!rule) return true;
  return evaluateCondition(rule, answers);
}
