// Thin client for calling strengthiva-backend (FastAPI). All calls include
// credentials so the Better Auth session cookie is sent — FastAPI's
// get_current_user reads it directly (see app/dependencies/auth.py).

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  resolved_items: ResolvedItem[];
  created_at: string;
  updated_at: string;
};

export type PrescriptionUpdate = {
  symptoms?: string[];
  duration?: string | null;
  focus?: string | null;
  prescribed_items?: string[];
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

export type ReportResponse = {
  id: string;
  summary: string;
  dosha: string;
  diet: string;
  products: ResolvedProduct[];
  created_at: string;
};

export const api = {
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
};

export { ApiError };
