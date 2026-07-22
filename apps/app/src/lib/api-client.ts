// Thin client for calling strengthiva-backend (FastAPI). All calls include
// credentials so the Better Auth session cookie is sent — FastAPI's
// get_current_user reads it directly (see app/dependencies/auth.py). The same
// cookie now also carries real admin identity (role="admin") for /admin's
// pages — see docs/platform-architecture/tech-specs/backend/
// admin-authentication.md — no separate admin-key header needed here.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Skip forcing JSON content-type for FormData bodies (file uploads) — the browser
  // sets the correct multipart/form-data boundary itself when left alone.
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // response body wasn't JSON — fall back to statusText
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export type HealthAssessmentResponse = {
  id: string;
  gender: string | null;
  bmi_range: string | null;
  chronic_conditions: string[];
  prescription_id: string | null;
  created_at: string;
};

export type ResolvedItem = {
  name: string;
  resolution:
    | { status: "resolved"; medusa_product_id: string; medusa_variant_id: string; sku: string; price: number | null; currency_code: string | null }
    | { status: "out_of_stock" }
    | { status: "unmapped" };
};

export type PrescriptionResponse = {
  id: string;
  filename: string;
  ocr_text: string;
  filtered_ocr_text: string;
  symptoms: string[];
  duration: string | null;
  focus: string | null;
  prescribed_items: string[];
  patient_name: string | null;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  resolved_items: ResolvedItem[];
  created_at: string;
  updated_at: string;
};

export type PrescriptionUpdate = {
  symptoms?: string[];
  duration?: string | null;
  focus?: string | null;
  prescribed_items?: string[];
  patient_name?: string | null;
  age?: number | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
};

export type ResolvedProduct = {
  name: string;
  purpose?: string;
  conditions?: string[];
  complement?: string;
  status?: string;
  resolution:
    | { status: "resolved"; medusa_product_id: string; medusa_variant_id: string; sku: string; price: number | null; currency_code: string | null }
    | { status: "out_of_stock" }
    | { status: "unmapped" };
};

export type QuestionnaireOptionOut = {
  value: string;
  label: string;
};

export type QuestionnaireQuestionOut = {
  field_key: string;
  label: string;
  sublabel: string | null;
  placeholder: string | null;
  field_type: string;
  required: boolean;
  columns: number | null;
  min: number | null;
  max: number | null;
  exclusive_value: string | null;
  visibility_rule: Record<string, unknown> | null;
  options: QuestionnaireOptionOut[];
};

export type QuestionnaireStepOut = {
  key: string;
  title: string;
  icon: string;
  step_type: string;
  visibility_rule: Record<string, unknown> | null;
  bmi_insert_before_field_key: string | null;
  questions: QuestionnaireQuestionOut[];
};

export type QuestionnaireSchemaResponse = {
  steps: QuestionnaireStepOut[];
};

// ── Admin: Questionnaire (/admin/questionnaire) ────────────────────────────
// Mirrors strengthiva-backend/app/schemas/questionnaire_admin.py.

export type AdminOption = {
  id: string;
  value: string;
  label: string;
  order_index: number;
  active: boolean;
};

export type AdminQuestion = {
  id: string;
  step_id: string;
  field_key: string;
  label: string;
  sublabel: string | null;
  placeholder: string | null;
  field_type: string;
  required: boolean;
  columns: number | null;
  min: number | null;
  max: number | null;
  order_index: number;
  active: boolean;
  prompt_label: string | null;
  exclusive_value: string | null;
  visibility_rule: Record<string, unknown> | null;
  is_protected: boolean;
  options: AdminOption[];
};

export type AdminStep = {
  id: string;
  key: string;
  title: string;
  icon: string;
  step_type: string;
  order_index: number;
  active: boolean;
  visibility_rule: Record<string, unknown> | null;
  bmi_insert_before_field_key: string | null;
  prompt_section: string | null;
  include_in_prompt: boolean;
  questions: AdminQuestion[];
};

export type StepCreatePayload = {
  key: string;
  title: string;
  icon: string;
  step_type: "fixed" | "disease_block";
  order_index?: number;
  visibility_rule?: Record<string, unknown> | null;
  bmi_insert_before_field_key?: string | null;
  prompt_section?: string | null;
  include_in_prompt?: boolean;
};

export type StepUpdatePayload = Partial<Omit<StepCreatePayload, "key" | "step_type">> & { active?: boolean };

export type QuestionCreatePayload = {
  step_id: string;
  field_key: string;
  label: string;
  sublabel?: string | null;
  placeholder?: string | null;
  field_type: string;
  required?: boolean;
  columns?: number | null;
  min?: number | null;
  max?: number | null;
  order_index?: number;
  prompt_label?: string | null;
  exclusive_value?: string | null;
  visibility_rule?: Record<string, unknown> | null;
};

export type QuestionUpdatePayload = Partial<Omit<QuestionCreatePayload, "step_id" | "field_key">> & {
  active?: boolean;
};

export type OptionCreatePayload = { value: string; label: string; order_index?: number };
export type OptionUpdatePayload = Partial<OptionCreatePayload> & { active?: boolean };

export type ReportResponse = {
  id: string;
  summary: string;
  dosha: string;
  diet: string;
  products: ResolvedProduct[];
  created_at: string;
};

export const api = {
  // DB-backed replacement for the hardcoded questionnaire-schema.ts content —
  // see strengthiva-backend/app/routers/questionnaire.py.
  getQuestionnaireSchema: () => request<QuestionnaireSchemaResponse>("/api/v1/questionnaire/schema"),

  createHealthAssessment: (answers: Record<string, unknown>, prescriptionId?: string) =>
    request<HealthAssessmentResponse>("/api/v1/health-assessments", {
      method: "POST",
      body: JSON.stringify({ answers, prescription_id: prescriptionId ?? null }),
    }),

  uploadPrescription: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<PrescriptionResponse>("/api/v1/prescriptions/upload", {
      method: "POST",
      body: form,
    });
  },

  getPrescription: (id: string) => request<PrescriptionResponse>(`/api/v1/prescriptions/${id}`),

  updatePrescription: (id: string, update: PrescriptionUpdate) =>
    request<PrescriptionResponse>(`/api/v1/prescriptions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(update),
    }),

  createReport: (healthAssessmentId: string) =>
    request<ReportResponse>("/api/v1/reports", {
      method: "POST",
      body: JSON.stringify({ health_assessment_id: healthAssessmentId }),
    }),

  getReport: (reportId: string) => request<ReportResponse>(`/api/v1/reports/${reportId}`),

  addToCart: (medusaVariantId: string, quantity = 1) =>
    request<{ store_cart_url: string }>("/api/v1/cart/add", {
      method: "POST",
      body: JSON.stringify({ medusa_variant_id: medusaVariantId, quantity }),
    }),

  // Plain-login SSO handoff to store.strengthiva.com (distinct from addToCart's
  // Cart Bridge handoff — no cart involved). See login-form.tsx.
  storeLoginHandoff: () =>
    request<{ store_login_url: string }>("/api/v1/auth/store-login-handoff", {
      method: "POST",
    }),

  // ── Admin: Knowledge Base indexing (/admin/knowledge-base) ──────────────
  indexStatus: () => request<Record<string, unknown>>("/api/v1/test/index/status"),

  indexDocuments: (docType: "diet_chart" | "product_recommendation") =>
    request<{ doc_type: string; documents: IndexedDocument[] }>(
      `/api/v1/test/index/documents?doc_type=${docType}`
    ),

  indexFile: (file: File, docType: "diet_chart" | "product_recommendation") => {
    const form = new FormData();
    form.append("file", file);
    form.append("doc_type", docType);
    return request<Record<string, unknown>>("/api/v1/test/index", {
      method: "POST",
      body: form,
    });
  },

  // ── Admin: Batch Certificates (/admin/batch-certificates) ────────────────
  createBatch: (batchNumber: string, productName: string | null) =>
    request<AdminBatch>("/api/v1/admin/batches", {
      method: "POST",
      body: JSON.stringify({ batch_number: batchNumber, product_name: productName }),
    }),

  listBatches: () => request<AdminBatch[]>("/api/v1/admin/batches"),

  uploadCertificate: (batchId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<AdminCertificate>(`/api/v1/admin/batches/${batchId}/certificates`, {
      method: "POST",
      body: form,
    });
  },

  vetCertificate: (batchId: string, certificateId: string, vettedBy: string) =>
    request<AdminCertificate>(
      `/api/v1/admin/batches/${batchId}/certificates/${certificateId}/vet`,
      { method: "POST", body: JSON.stringify({ vetted_by: vettedBy }) }
    ),

  // ── Admin: Questionnaire (/admin/questionnaire) ──────────────────────────
  getAdminQuestionnaireSteps: () =>
    request<{ steps: AdminStep[] }>("/api/v1/admin/questionnaire/steps"),

  createStep: (payload: StepCreatePayload) =>
    request<AdminStep>("/api/v1/admin/questionnaire/steps", { method: "POST", body: JSON.stringify(payload) }),
  updateStep: (stepId: string, payload: StepUpdatePayload) =>
    request<AdminStep>(`/api/v1/admin/questionnaire/steps/${stepId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteStep: (stepId: string) =>
    request<void>(`/api/v1/admin/questionnaire/steps/${stepId}`, { method: "DELETE" }),
  reorderSteps: (stepIds: string[]) =>
    request<void>("/api/v1/admin/questionnaire/steps/reorder", {
      method: "PUT",
      body: JSON.stringify({ step_ids: stepIds }),
    }),

  createQuestion: (payload: QuestionCreatePayload) =>
    request<AdminQuestion>("/api/v1/admin/questionnaire/questions", { method: "POST", body: JSON.stringify(payload) }),
  updateQuestion: (questionId: string, payload: QuestionUpdatePayload) =>
    request<AdminQuestion>(`/api/v1/admin/questionnaire/questions/${questionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteQuestion: (questionId: string) =>
    request<void>(`/api/v1/admin/questionnaire/questions/${questionId}`, { method: "DELETE" }),
  reorderQuestions: (stepId: string, questionIds: string[]) =>
    request<void>(`/api/v1/admin/questionnaire/steps/${stepId}/reorder-questions`, {
      method: "PUT",
      body: JSON.stringify({ question_ids: questionIds }),
    }),

  createOption: (questionId: string, payload: OptionCreatePayload) =>
    request<AdminOption>(`/api/v1/admin/questionnaire/questions/${questionId}/options`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateOption: (optionId: string, payload: OptionUpdatePayload) =>
    request<AdminOption>(`/api/v1/admin/questionnaire/options/${optionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteOption: (optionId: string) =>
    request<void>(`/api/v1/admin/questionnaire/options/${optionId}`, { method: "DELETE" }),
  reorderOptions: (questionId: string, optionIds: string[]) =>
    request<void>(`/api/v1/admin/questionnaire/questions/${questionId}/reorder-options`, {
      method: "PUT",
      body: JSON.stringify({ option_ids: optionIds }),
    }),
};

export type IndexedDocument = {
  document_id: string;
  filename: string;
  chunk_count: number;
};

export type AdminCertificate = {
  id: string;
  original_filename: string;
  status: string;
  vetted_by: string | null;
  vetted_at: string | null;
  created_at: string;
};

export type AdminBatch = {
  id: string;
  batch_number: string;
  product_name: string | null;
  medusa_product_id: string | null;
  verify_url: string;
  certificates: AdminCertificate[];
  created_at: string;
};

export { ApiError };
