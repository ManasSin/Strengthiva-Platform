import { API_URL } from "./api-client";
import type {
  BatchDetail,
  BatchSummary,
  CompanySettings,
  DocumentKind,
  DocumentRecord,
  ImportPreview,
  ImportResult,
  IngredientMaster,
  NameDecision,
  ProductDetail,
  ProductUpdate,
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
  updateProduct: (id: string, body: Partial<ProductUpdate>) =>
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
  settings: (signal?: AbortSignal) =>
    request<CompanySettings>("/settings", { signal }),
  saveSettings: (body: CompanySettings) =>
    request<CompanySettings>("/settings", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  qr: async (id: string) => {
    const response = await fetch(`${base}/batch-products/${id}/qr`, {
      credentials: "include",
    });
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
