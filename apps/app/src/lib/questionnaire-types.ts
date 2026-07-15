// Shared types for the health assessment wizard's data-driven schema.
// See src/lib/questionnaire-schema.ts and
// docs/platform-architecture/tech-specs/backend/health-assessment-and-reports.md.

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
  // Field only renders/counts toward validation when this returns true. Ported
  // 1:1 from static/test-ui.html's JS `tog(...)` conditional-visibility calls —
  // see the exact conditions documented next to each field below.
  visibleIf?: (answers: Answers) => boolean;
};

export type StepDef = {
  id: string;
  title: string;
  icon: string;
  fields: FieldDef[];
};
