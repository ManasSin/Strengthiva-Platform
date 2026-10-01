import { API_URL } from "./api-client";
import type {
  AuditEntry,
  BatchDetail,
  BatchSummary,
  CompanySettings,
  DocumentKind,
  DocumentRecord,
  ImportPreview,
  ImportResult,
  IngredientMaster,
  IngredientRowInput,
  NameDecision,
  NewBatchInput,
  NewRecordInput,
  ProductDetail,
  ProductSearchResult,
  ProductUpdate,
  QrSize,
  RecipeItem,
} from "@strengthiva/transparency/types";

export class TransparencyError extends Error {
  constructor(
    public status: number,
    message: string,
    public blockers: string[] = []
  ) {
    super(message);
  }
}
function errorMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((item) => errorMessage(item)).join("; ");
  if (detail && typeof detail === "object") {
    if ("message" in detail) return String(detail.message);
    if ("msg" in detail) return String(detail.msg);
  }
  return "The request could not be completed. Please try again.";
}
const base = `${API_URL}/api/v1/admin/transparency`;
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new TransparencyError(
      0,
      "We couldn’t reach the record service. Check your connection and try again."
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      response.status === 401
        ? "Your session has ended. Sign in again to continue."
        : response.status === 403
        ? "Your account does not have access to these records."
        : response.status === 429
        ? "Too many requests. Wait a moment, then try again."
        : errorMessage(body?.detail);
    throw new TransparencyError(
      response.status,
      message,
      body?.detail?.blockers || []
    );
  }
  return response.json();
}
async function listAll<T>(path: string, size: number, signal?: AbortSignal) {
  const all: T[] = [];
  for (let offset = 0; ; offset += size) {
    const page = await request<T[]>(`${path}?limit=${size}&offset=${offset}`, {
      signal,
    });
    all.push(...page);
    if (page.length < size) return all;
  }
}
export const transparencyApi = {
  batches: (signal?: AbortSignal) =>
    listAll<BatchSummary>("/batches", 500, signal),
  batch: (id: string, signal?: AbortSignal) =>
    request<BatchDetail>(`/batches/${id}`, { signal }),
  product: (id: string, signal?: AbortSignal) =>
    request<ProductDetail>(`/batch-products/${id}`, { signal }),
  updateProduct: (
    id: string,
    body: Partial<ProductUpdate> & { reason?: string | null }
  ) =>
    request<ProductDetail>(`/batch-products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  publish: (id: string, by: string) =>
    request<ProductDetail>(`/batch-products/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({ published_by: by }),
    }),
  unpublish: (id: string) =>
    request<ProductDetail>(`/batch-products/${id}/unpublish`, {
      method: "POST",
    }),
  preview: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<ImportPreview>("/imports", { method: "POST", body });
  },
  commit: (
    id: string,
    body: { products: NameDecision[]; ingredients: NameDecision[] }
  ) =>
    request<ImportResult>(`/imports/${id}/commit`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  upload: (id: string, file: File, kind: DocumentKind) => {
    const body = new FormData();
    body.append("file", file, file.name);
    body.append("kind", kind);
    return request<DocumentRecord>(`/batch-products/${id}/documents`, {
      method: "POST",
      body,
    });
  },
  attach: (id: string, rows: string[]) =>
    request<DocumentRecord>(`/documents/${id}/attach`, {
      method: "POST",
      body: JSON.stringify({ ingredient_row_ids: rows }),
    }),
  /**
   * Remove an uploaded document. Returns 204 with no body, so it cannot go
   * through `request`, which always parses JSON.
   */
  deleteDocument: async (id: string) => {
    const response = await fetch(`${base}/documents/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new TransparencyError(
        response.status,
        errorMessage(body?.detail) || "The document could not be removed."
      );
    }
  },
  ingredients: (signal?: AbortSignal) =>
    listAll<IngredientMaster>("/ingredients", 1000, signal),
  updateIngredient: (
    id: string,
    body: Pick<IngredientMaster, "name" | "botanical_name" | "plant_part">
  ) =>
    request<IngredientMaster>(`/ingredients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  // ── Authoring ──────────────────────────────────────────────────────────────
  // Creating records without a workbook. The import methods above are unchanged
  // and remain the fallback.
  searchProducts: (q: string, signal?: AbortSignal) =>
    request<ProductSearchResult[]>(
      `/products?limit=20${q ? `&q=${encodeURIComponent(q)}` : ""}`,
      { signal }
    ),
  createProduct: (body: { name: string; medusa_product_id?: string | null }) =>
    request<{ id: string; name: string; slug: string }>("/products", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  productRecipe: (id: string, signal?: AbortSignal) =>
    request<RecipeItem[]>(`/products/${id}/recipe`, { signal }),
  createBatch: (body: NewBatchInput) =>
    request<BatchSummary>("/batches", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  /**
   * Reserve the record a QR code points at. Callable the day the batch number is
   * known — the code is downloadable immediately, and resolves to a 404 for
   * anyone who scans it until the record is published.
   */
  createRecord: (body: NewRecordInput) =>
    request<ProductDetail>("/batch-products", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  createIngredient: (body: {
    name: string;
    botanical_name?: string | null;
    plant_part?: string | null;
  }) =>
    request<IngredientMaster>("/ingredients", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  /** Whole-table save. List order becomes each row's position. */
  replaceIngredients: (
    id: string,
    rows: IngredientRowInput[],
    reason?: string | null
  ) =>
    request<ProductDetail>(`/batch-products/${id}/ingredients`, {
      method: "PUT",
      body: JSON.stringify({ rows, reason: reason || null }),
    }),
  updateIngredientRow: (
    id: string,
    rowId: string,
    body: Partial<IngredientRowInput> & {
      position?: number;
      reason?: string | null;
    }
  ) =>
    request<ProductDetail>(`/batch-products/${id}/ingredients/${rowId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  history: (id: string, signal?: AbortSignal) =>
    request<AuditEntry[]>(`/batch-products/${id}/history`, { signal }),
  settings: (signal?: AbortSignal) =>
    request<CompanySettings>("/settings", { signal }),
  saveSettings: (body: CompanySettings) =>
    request<CompanySettings>("/settings", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  qr: async (id: string, size?: QrSize) => {
    const response = await fetch(
      `${base}/batch-products/${id}/qr${size ? `?size=${size}` : ""}`,
      { credentials: "include" }
    );
    if (!response.ok)
      throw new TransparencyError(
        response.status,
        "The QR code could not be downloaded."
      );
    return response.blob();
  },
};
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export const publicDocumentUrl = (productId: string, documentId: string) =>
  `${API_URL}/api/v1/transparency/${productId}/documents/${documentId}`;
