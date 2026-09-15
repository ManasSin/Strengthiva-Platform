import type {
  BatchSummary,
  DocumentKind,
  ProductDetail,
  ProductUpdate,
  Suggestion,
} from "./types";

export const QA_FIELDS = [
  ["qa_raw_material", "Raw material identity"],
  ["qa_heavy_metals", "Heavy metals"],
  ["qa_pesticide", "Pesticide residue"],
  ["qa_microbial", "Microbial limits"],
  ["qa_final", "Final quality assurance"],
] as const satisfies ReadonlyArray<readonly [keyof ProductUpdate, string]>;
export const DOCUMENT_LABELS: Record<DocumentKind, string> = {
  coa: "Certificate of Analysis",
  batch_report: "Batch Report",
  ingredient_spec: "Ingredient Specifications",
  lab_report: "Lab Report",
  certificate: "Certificate",
};
export const DOCUMENT_SLOTS: DocumentKind[] = [
  "coa",
  "batch_report",
  "ingredient_spec",
];
export function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}
export function quantity(value: number | null, unit: string | null) {
  return value === null ? "Not recorded" : `${value}${unit ? ` ${unit}` : ""}`;
}
export function outcome(
  raw: string | null | undefined
): "pass" | "fail" | null {
  const text = raw?.trim().toLowerCase();
  if (
    [
      "pass",
      "passed",
      "verified",
      "approved",
      "ok",
      "yes",
      "complies",
      "conforms",
    ].includes(text || "")
  )
    return "pass";
  if (
    [
      "fail",
      "failed",
      "rejected",
      "not approved",
      "no",
      "out of spec",
    ].includes(text || "")
  )
    return "fail";
  return null;
}
export function publication(batch: BatchSummary) {
  return batch.published_count === 0
    ? "draft"
    : batch.published_count === batch.product_count
    ? "published"
    : "partial";
}
// Only a literal expansion of the same plant part qualifies for the bulk action.
// A similarity score alone must never preselect Amla → Amla Ghana.
export function safeSuggestion(suggestion: Suggestion) {
  return (
    suggestion.reason === "Same name with the plant part written out in full"
  );
}
export function decisionFor(key: string, suggestion: Suggestion) {
  return {
    key,
    action: "link" as const,
    ...(suggestion.id
      ? { target_id: suggestion.id }
      : { target_name: suggestion.name }),
  };
}
export function productValues(product: ProductDetail): ProductUpdate {
  return {
    received_date: product.received_date,
    manufacturing_date: product.manufacturing_date,
    expiry_date: product.expiry_date,
    qa_raw_material: product.qa_raw_material,
    qa_heavy_metals: product.qa_heavy_metals,
    qa_pesticide: product.qa_pesticide,
    qa_microbial: product.qa_microbial,
    qa_final: product.qa_final,
  };
}
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  // Spreadsheet exports should not turn a user-supplied name into a formula.
  return `"${(/^[=+@\-\t\r]/.test(text) ? `'${text}` : text).replaceAll(
    '"',
    '""'
  )}"`;
}
export function matchDocument(
  filename: string,
  products: { id: string; product_name: string }[]
) {
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const stem = normalize(filename.replace(/\.pdf$/i, ""));
  const kinds: DocumentKind[] = [];
  if (/\b(coa|certificate of analysis)\b/.test(stem)) kinds.push("coa");
  if (
    /\b(batch report|batch|report)\b/.test(stem) &&
    !/\b(lab|coa|spec)\b/.test(stem)
  )
    kinds.push("batch_report");
  if (
    /\b(spec|specs|specification|specifications|ingredient specifications)\b/.test(
      stem
    )
  )
    kinds.push("ingredient_spec");
  const candidates = products.filter((p) => {
    const full = normalize(p.product_name);
    const base = full
      .replace(/\b(tablets?|capsules?|syrup|oil|drops|with hing)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return (
      ` ${stem} `.includes(` ${full} `) ||
      (base.length >= 4 && ` ${stem} `.includes(` ${base} `))
    );
  });
  return {
    productId: candidates.length === 1 ? candidates[0].id : "",
    kind: kinds.length === 1 ? kinds[0] : "",
    state:
      candidates.length === 1 && kinds.length === 1
        ? "matched"
        : candidates.length > 1
        ? "ambiguous"
        : "unmatched",
  } as const;
}
