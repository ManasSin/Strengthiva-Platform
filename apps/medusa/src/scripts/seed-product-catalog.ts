// Seeds the real Strengthiva Ayurvedic product range (8 categories, 14 named
// formulations) from the product list the brand provided, replacing the
// generic clothing demo data as the intended real catalog. See
// docs/product-data-template.md for the full "what we need per product before
// launch" checklist this script's placeholders are standing in for.
//
// IMPORTANT: every product here is created with status DRAFT (not PUBLISHED)
// and a description explicitly flagged as placeholder — price, weight, and
// description are invented filler, not real product data. Nothing here is
// customer-visible on the live storefront until someone reviews the real
// data and manually publishes each product from the admin dashboard. This
// mirrors the DraftNotice pattern already used for the legal pages
// (apps/app/src/components/legal/draft-notice.tsx) — don't silently present
// invented content as real.
//
// Run manually, not part of automatic migrations:
//   pnpm --filter @strengthiva/medusa seed:product-catalog
//
// Idempotent: checks for each category/product by name/handle first.
import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/core-flows";

// The real, in-use sales channel/stock location — verified directly against
// the running dev DB (a stray duplicate "Default Sales Channel" also exists
// from an unrelated `medusa db:migrate` re-run during Docker testing; this is
// deliberately NOT that one — see docs/platform-architecture/02-decisions-log.md).
const SALES_CHANNEL_ID = "sc_01KXBZD4J4Q970HSBGM9QDZVGS";
const INDIA_STOCK_LOCATION_ID = "sloc_01KXGZA153N6Z3RSC3GSTRA46H";

const DRAFT_NOTE =
  "[DRAFT — placeholder description, price, and weight, pending real product content. Not for customer display until reviewed and published.] ";

type PackSize = "60 Tablets" | "200 ml" | "50 ml" | "30 ml";

const PACK_SIZE_DEFAULTS: Record<PackSize, { weight: number; price: number }> = {
  "60 Tablets": { weight: 100, price: 249 },
  "200 ml": { weight: 250, price: 199 },
  "50 ml": { weight: 80, price: 279 },
  "30 ml": { weight: 50, price: 149 },
};

type ProductSeed = {
  title: string;
  category: string;
  tagline: string;
  packSize: PackSize;
};

const CATEGORIES = [
  "Renal Health",
  "Liver Health",
  "Respiratory Health",
  "Joint Health",
  "Gut Health",
  "Weight Management",
  "Nervous System",
  "Gynaecological Disorder",
];

// Straight from the product list PDF — 14 named formulations. The deck's own
// cover slide says "21 formulations" total but only these 14 are actually
// named/described anywhere in the material provided; the other 7 aren't
// represented here since inventing names for them would be fabricating
// product identity, not filling in a data gap. Flagged to the user directly,
// not silently assumed.
const PRODUCTS: ProductSeed[] = [
  { title: "Stoniva", category: "Renal Health", tagline: "Flush away the stone naturally, dissolve stones naturally", packSize: "60 Tablets" },
  { title: "Detoxiva", category: "Liver Health", tagline: "Toxins out, energy within, reboot your liver's daily shield", packSize: "60 Tablets" },
  { title: "Liveriva Syrup", category: "Liver Health", tagline: "Your daily dose of liver wellness", packSize: "200 ml" },
  { title: "Coughiva Syrup", category: "Respiratory Health", tagline: "Clears chest naturally", packSize: "200 ml" },
  { title: "Respiriva Syrup", category: "Respiratory Health", tagline: "From irritation to comfort", packSize: "200 ml" },
  { title: "Tulsi Drops", category: "Respiratory Health", tagline: "Immunity made natural", packSize: "30 ml" },
  { title: "Orthiva Oil", category: "Joint Health", tagline: "Unlock your joints, back to easy movement", packSize: "50 ml" },
  { title: "Orthiva Tablet", category: "Joint Health", tagline: "Ease every step", packSize: "60 Tablets" },
  { title: "Digestiva Syrup", category: "Gut Health", tagline: "From burn to balance", packSize: "200 ml" },
  { title: "Agnivita Tablet", category: "Gut Health", tagline: "Fire up your gut", packSize: "60 Tablets" },
  { title: "Easy Motion Plus Tablet", category: "Gut Health", tagline: "Clear your system", packSize: "60 Tablets" },
  { title: "Lean Veda Plus Tablet", category: "Weight Management", tagline: "Shape your best you, balance your body", packSize: "60 Tablets" },
  { title: "Mindiva Syrup", category: "Nervous System", tagline: "Power up your mind", packSize: "200 ml" },
  { title: "Striva Syrup", category: "Gynaecological Disorder", tagline: "Restore harmony, relieve discomfort", packSize: "200 ml" },
];

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function seedProductCatalog({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // --- Categories (idempotent: check existing names first) ---
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });
  const existingCategoryNames = new Set(existingCategories.map((c) => c.name));
  const categoriesToCreate = CATEGORIES.filter((name) => !existingCategoryNames.has(name));

  if (categoriesToCreate.length > 0) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: categoriesToCreate.map((name) => ({
          name,
          is_active: true,
        })),
      },
    });
    logger.info(`Created ${categoriesToCreate.length} product categories`);
  } else {
    logger.info("All 8 categories already exist, skipping");
  }

  const { data: allCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });
  const categoryIdByName = new Map(allCategories.map((c) => [c.name, c.id]));

  // --- Shared "Pack Size" option (mirrors the starter's shared Size/Color
  // option pattern in initial-data-seed.ts, just on a single axis) ---
  const { data: existingOptions } = await query.graph({
    entity: "product_option",
    fields: ["id", "title"],
  });
  let packSizeOptionId = existingOptions.find((o) => o.title === "Pack Size")?.id;

  if (!packSizeOptionId) {
    const { result: optionsResult } = await createProductOptionsWorkflow(container).run({
      input: {
        product_options: [
          {
            title: "Pack Size",
            values: Object.keys(PACK_SIZE_DEFAULTS),
          },
        ],
      },
    });
    packSizeOptionId = optionsResult[0].id;
    logger.info("Created shared 'Pack Size' product option");
  } else {
    logger.info("'Pack Size' option already exists, skipping");
  }

  // --- Products (idempotent: check existing handles first) ---
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  });
  const existingHandles = new Set(existingProducts.map((p) => p.handle));

  const productsToCreate = PRODUCTS.filter(
    (p) => !existingHandles.has(slugify(p.title))
  );

  if (productsToCreate.length === 0) {
    logger.info("All 14 products already exist, skipping");
    return;
  }

  await createProductsWorkflow(container).run({
    input: {
      products: productsToCreate.map((p) => {
        const { weight, price } = PACK_SIZE_DEFAULTS[p.packSize];
        const handle = slugify(p.title);
        return {
          title: p.title,
          subtitle: p.tagline,
          handle,
          description: `${DRAFT_NOTE}${p.tagline}. Part of Strengthiva's ${p.category} range.`,
          status: ProductStatus.DRAFT,
          weight,
          category_ids: [categoryIdByName.get(p.category)!],
          options: [{ id: packSizeOptionId! }],
          variants: [
            {
              title: p.packSize,
              sku: `${handle.toUpperCase()}-${p.packSize.replace(/\s+/g, "")}`,
              options: { "Pack Size": p.packSize },
              weight,
              prices: [
                {
                  amount: price,
                  currency_code: "inr",
                },
              ],
            },
          ],
          sales_channels: [{ id: SALES_CHANNEL_ID }],
        };
      }),
    },
  });

  logger.info(`Created ${productsToCreate.length} products (status: draft)`);

  // --- Inventory — stock the new variants at the India warehouse ---
  const { data: newProducts } = await query.graph({
    entity: "product",
    fields: ["id", "variants.id", "variants.sku"],
    filters: {
      handle: productsToCreate.map((p) => slugify(p.title)),
    },
  });
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  });
  const newSkus = new Set(
    newProducts.flatMap((p) => p.variants?.map((v) => v.sku) ?? [])
  );
  const newInventoryItems = inventoryItems.filter((i) => i.sku && newSkus.has(i.sku));

  if (newInventoryItems.length > 0) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: newInventoryItems.map((item) => ({
          location_id: INDIA_STOCK_LOCATION_ID,
          stocked_quantity: 1000,
          inventory_item_id: item.id,
        })),
      },
    });
    logger.info(`Set inventory for ${newInventoryItems.length} new variants at the India warehouse`);
  }

  logger.info(
    "Product catalog seeded — all products are DRAFT status (not visible on the storefront). Review docs/product-data-template.md, fill in real data, then publish each product manually from the admin dashboard."
  );
}
