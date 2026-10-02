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
/**
 * A hit in the product typeahead. `recipe_item_count` is why the typeahead is
 * worth having — it says how many ingredient rows picking this product will
 * prefill, before the operator commits to it.
 */
export type ProductSearchResult = {
  id: string;
  name: string;
  slug: string;
  recipe_item_count: number;
  batch_count: number;
};
/** A row of a product's standing recipe, independent of any batch. */
export type RecipeItem = {
  ingredient_id: string;
  name: string;
  botanical_name: string | null;
  qty_value: number | null;
  qty_unit: string | null;
  position: number;
};
/**
 * One ingredient row being written. Either `ingredient_id` (chosen from the
 * master) or `name` (typed, then matched or created server-side) — not both.
 *
 * Deliberately not IngredientRow: that carries a row `id` and a resolved
 * botanical name, neither of which the client ever sends.
 */
export type IngredientRowInput = {
  ingredient_id?: string | null;
  name?: string | null;
  qty_value: number | null;
  qty_unit: string | null;
  quality_score: number | null;
  source_location: string | null;
  qc_status: string | null;
  lab_report_id?: string | null;
};
/**
 * One recorded change. `entity_label` is the ingredient name for a row edit,
 * captured when the change was made so the entry still reads after the row it
 * refers to has been deleted.
 */
export type AuditEntry = {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_label: string | null;
  field: string;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  changed_by: string | null;
  changed_at: string;
};
export type QrSize = "small" | "medium" | "large";
export type NewBatchInput = {
  batch_number: string;
  po_number: string | null;
  order_date: string | null;
};
export type NewRecordInput = {
  batch_id: string;
  product_id?: string | null;
  product_name?: string | null;
  seed_from_recipe: boolean;
  received_date?: string | null;
  manufacturing_date?: string | null;
  expiry_date?: string | null;
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
