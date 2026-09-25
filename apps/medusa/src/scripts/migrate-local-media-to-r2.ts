// One-off: moves product images still stored by Medusa's local-disk file provider
// (http://localhost:9000/static/<file>, or the LOCAL_FILE_PUBLIC_URL stopgap) to the
// configured file provider — Cloudflare R2 once R2_* is set (see medusa-config.ts) —
// and rewrites the product thumbnail/image URLs to the new ones.
//
// Run inside the Medusa container AFTER R2 is configured. MEDIA_DIR defaults to the
// container's static/ (the medusa_uploads volume):
//   docker exec -e DRY_RUN=1 strengthiva-platform-medusa-1 \
//     npx medusa exec ./src/scripts/migrate-local-media-to-r2.ts
// then again without DRY_RUN. Idempotent: already-migrated URLs are skipped.
import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { existsSync, readFileSync } from "fs"
import path from "path"

// URLs the local-disk provider has written: its default, and the public stopgap URL
// (LOCAL_FILE_PUBLIC_URL, see medusa-config.ts) used before R2 was configured.
const LOCAL_PREFIXES = [
  "http://localhost:9000/static/",
  ...(process.env.LOCAL_FILE_PUBLIC_URL
    ? [`${process.env.LOCAL_FILE_PUBLIC_URL.replace(/\/+$/, "")}/`]
    : []),
]
const localPrefixOf = (url: string | null | undefined) =>
  url ? LOCAL_PREFIXES.find((p) => url.startsWith(p)) : undefined

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
}

export default async function migrateLocalMedia({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const fileService = container.resolve(Modules.FILE)
  const productService = container.resolve(Modules.PRODUCT)
  const mediaDir = process.env.MEDIA_DIR || path.join(process.cwd(), "static")
  const dryRun = Boolean(process.env.DRY_RUN)

  const products = await productService.listProducts({}, { relations: ["images"], take: 10000 })
  const moved = new Map<string, string>() // old URL -> new URL, so a shared file uploads once

  async function migrate(url: string | null | undefined): Promise<string | null | undefined> {
    const prefix = localPrefixOf(url)
    if (!url || !prefix) return url
    if (moved.has(url)) return moved.get(url)
    const name = decodeURIComponent(url.slice(prefix.length))
    const filePath = path.join(mediaDir, name)
    if (!existsSync(filePath)) {
      logger.warn(`Missing file for ${url} (looked in ${filePath}); leaving it as is`)
      return url
    }
    if (dryRun) {
      logger.info(`[dry run] would upload ${filePath}`)
      moved.set(url, url)
      return url
    }
    const [uploaded] = await fileService.createFiles([
      {
        filename: name.replace(/^\d+-/, ""), // drop the local provider's timestamp prefix
        mimeType: MIME[path.extname(name).toLowerCase()] ?? "application/octet-stream",
        content: readFileSync(filePath).toString("base64"),
        access: "public",
      },
    ])
    moved.set(url, uploaded.url)
    logger.info(`Uploaded ${name} -> ${uploaded.url}`)
    return uploaded.url
  }

  let updated = 0
  for (const product of products) {
    const urls = [product.thumbnail, ...(product.images ?? []).map((i) => i.url)]
    if (!urls.some((u) => localPrefixOf(u))) continue

    const images = []
    for (const image of product.images ?? []) {
      images.push({ url: (await migrate(image.url)) as string })
    }
    const thumbnail = await migrate(product.thumbnail)
    if (!dryRun) {
      await productService.updateProducts(product.id, { images, thumbnail })
    }
    updated++
    logger.info(`${dryRun ? "[dry run] " : ""}${product.title}: ${images.length} image(s)`)
  }
  logger.info(`${dryRun ? "[dry run] " : ""}Done: ${updated} product(s), ${moved.size} file(s).`)
}
