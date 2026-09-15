// Mirrors FastAPI's app/schemas/transparency.py. No prototype data enters the UI.
export type Suggestion = {
  id: string | null;
  name: string;
  score: number;
  reason: string;
};
export type UnresolvedName = {
  kind: "product" | "ingredient";
  raw: string;
  key: string;
  occurrences: number;
  suggestions: Suggestion[];
};
export type NameDecision = {
  key: string;
  action: "link" | "create";
  target_id?: string;
  target_name?: string;
};
export type ImportCounts = {
  batches: number;
  batch_products: number;
  ingredient_rows: number;
  recipe_rows: number;
  products_matched: number;
  products_new: number;
  ingredients_matched: number;
  ingredients_new: number;
};
export type ImportPreview = {
  import_id: string;
  filename: string;
  counts: ImportCounts;
  conflicting_batches: string[];
  unresolved: UnresolvedName[];
  warnings: string[];
};
export type ImportResult = {
  import_id: string;
  counts: ImportCounts;
  batch_products_created: number;
  aliases_learned: number;
  auto_created: string[];
  warnings: string[];
};
export type BatchSummary = {
  id: string;
  batch_number: string;
  po_number: string | null;
  order_date: string | null;
  product_count: number;
  published_count: number;
  created_at: string;
};
export type ProductSummary = {
  id: string;
  product_name: string;
  status: "draft" | "published";
  manufacturing_date: string | null;
  expiry_date: string | null;
  ingredient_count: number;
  document_count: number;
  blockers: string[];
};
export type BatchDetail = {
  id: string;
  batch_number: string;
  po_number: string | null;
  order_date: string | null;
  products: ProductSummary[];
};
export type IngredientRow = {
  id: string;
  ingredient_id: string;
  name: string;
  botanical_name: string | null;
  qty_value: number | null;
  qty_unit: string | null;
  quality_score: number | null;
  source_location: string | null;
  qc_status: string | null;
  lab_report_id: string | null;
  position: number;
};
export type DocumentKind =
  | "coa"
  | "batch_report"
  | "ingredient_spec"
  | "lab_report"
  | "certificate";
export type DocumentRecord = {
  id: string;
  kind: DocumentKind;
  original_filename: string;
  status: string;
  vetted_at: string | null;
  created_at: string;
};
export type ProductUpdate = {
  received_date: string | null;
  manufacturing_date: string | null;
  expiry_date: string | null;
  qa_raw_material: string | null;
  qa_heavy_metals: string | null;
  qa_pesticide: string | null;
  qa_microbial: string | null;
  qa_final: string | null;
};
export type ProductDetail = ProductUpdate & {
  id: string;
  batch_id: string;
  batch_number: string;
  product_id: string;
  product_name: string;
  status: "draft" | "published";
  verify_url: string;
  published_at: string | null;
  published_by: string | null;
  ingredients: IngredientRow[];
  documents: DocumentRecord[];
  blockers: string[];
  warnings: string[];
};
export type IngredientMaster = {
  id: string;
  name: string;
  botanical_name: string | null;
  plant_part: string | null;
  botanical_suggestion: string | null;
  used_in_products: number;
  alias_count: number;
};
export type CompanySettings = {
  manufacturer_name: string | null;
  manufacturer_address: string | null;
  fssai_licence: string | null;
  ayush_licence: string | null;
  certifications: string[] | null;
  updated_at?: string | null;
};
export type PublicIngredient = Omit<
  IngredientRow,
  "id" | "ingredient_id" | "lab_report_id" | "position"
> & { lab_report_url: string | null };
export type PublicRecord = Omit<CompanySettings, "updated_at"> & {
  id: string;
  product_name: string;
  batch_number: string;
  manufacturing_date: string | null;
  expiry_date: string | null;
  expiry_state: "valid" | "expiring_soon" | "expired" | null;
  quality_checks: {
    label: string;
    outcome: "pass" | "fail" | null;
    recorded: string | null;
  }[];
  ingredients: PublicIngredient[];
  documents: {
    id: string;
    kind: DocumentKind;
    filename: string;
    url: string;
  }[];
};
