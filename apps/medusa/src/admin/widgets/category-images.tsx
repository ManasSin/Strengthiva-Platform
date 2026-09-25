import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProductCategory, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useRef, useState } from "react"

// Medusa product categories have no images of their own, so the storefront reads
// them from category.metadata:
//   metadata.images    — string[] of public URLs (Cloudflare R2 in production)
//   metadata.thumbnail — the cover, always images[0]
// Files go through the same POST /admin/uploads the product media form uses, so
// they land wherever the file module stores them. The dashboard shares the admin
// session cookie, so plain fetch with credentials works.

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // matches admin.maxUploadFileSize in medusa-config.ts

function imagesOf(category: AdminProductCategory): string[] {
  const images = category.metadata?.images
  return Array.isArray(images) ? images.filter((u): u is string => typeof u === "string") : []
}

async function adminFetch<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", ...init })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || `Request failed (${response.status})`)
  }
  return response.json()
}

const CategoryImagesWidget = ({ data: category }: DetailWidgetProps<AdminProductCategory>) => {
  const [images, setImages] = useState<string[]>(() => imagesOf(category))
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function save(next: string[]) {
    // Send the whole metadata object back so other keys on it survive.
    await adminFetch(`/admin/product-categories/${category.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metadata: { ...(category.metadata ?? {}), images: next, thumbnail: next[0] ?? null },
      }),
    })
    category.metadata = { ...(category.metadata ?? {}), images: next, thumbnail: next[0] ?? null }
    setImages(next)
  }

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (!files.length) return
    const tooBig = files.filter((f) => f.size > MAX_UPLOAD_BYTES)
    if (tooBig.length) {
      toast.error(`Over 10 MB, not uploaded: ${tooBig.map((f) => f.name).join(", ")}`)
    }
    const ok = files.filter((f) => f.size <= MAX_UPLOAD_BYTES)
    if (!ok.length) return

    setBusy(true)
    try {
      const form = new FormData()
      ok.forEach((f) => form.append("files", f))
      const { files: uploaded } = await adminFetch<{ files: { url: string }[] }>("/admin/uploads", {
        method: "POST",
        body: form,
      })
      await save([...images, ...uploaded.map((f) => f.url)])
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} added`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function update(next: string[], message: string) {
    setBusy(true)
    try {
      await save(next)
      toast.success(message)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Images</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            The first image is the cover on the store. Up to 10 MB each; select several at once.
          </Text>
        </div>
        <Button size="small" variant="secondary" isLoading={busy} onClick={() => inputRef.current?.click()}>
          Upload images
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {images.length === 0 ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted">
            No images yet.
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-6 py-4 sm:grid-cols-3">
          {images.map((url, i) => (
            <div key={url} className="overflow-hidden rounded-lg border border-ui-border-base">
              <img src={url} alt="" className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between gap-1 p-2">
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {i === 0 ? "Cover" : `#${i + 1}`}
                </Text>
                <div className="flex gap-1">
                  {i > 0 && (
                    <Button
                      size="small"
                      variant="transparent"
                      disabled={busy}
                      onClick={() => update([url, ...images.filter((u) => u !== url)], "Cover updated")}
                    >
                      Make cover
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="transparent"
                    disabled={busy}
                    onClick={() => update(images.filter((u) => u !== url), "Image removed")}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.after",
})

export default CategoryImagesWidget
