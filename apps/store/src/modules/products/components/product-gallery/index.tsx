"use client"

import { ProductForm } from "@lib/util/store-catalog"
import Bottle from "@modules/common/components/bottle"
import { CheckCircleIcon } from "@modules/common/components/store-icons"
import { useState } from "react"

/*
  product.html's gallery: one large frame + thumbnails. With Medusa images the
  thumbnails are the product's photos; without any, it falls back to the
  prototype's three placeholder frames (pack illustration, a check mark, and a
  "Traceable herbs" label).
*/
export default function ProductGallery({
  images,
  form,
  name,
}: {
  images: { id: string; url: string }[]
  form: ProductForm
  name: string
}) {
  const frames: React.ReactNode[] = images.length
    ? images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- remote R2/Medusa URL
        <img key={img.id} src={img.url} alt={i === 0 ? name : `${name} — image ${i + 1}`} />
      ))
    : [
        <Bottle key="bottle" form={form} name={name} />,
        <CheckCircleIcon
          key="check"
          strokeWidth={1.4}
          style={{ width: "60%", height: "60%", color: "var(--green-deep)" }}
        />,
        <span key="label" className="meta" style={{ fontSize: 9, textAlign: "center", padding: 4 }}>
          Traceable herbs
        </span>,
      ]
  const [active, setActive] = useState(0)

  return (
    <div>
      <div className="gallery-main" data-testid="product-image">
        {frames[active]}
      </div>
      {frames.length > 1 && (
        <div className="gallery-thumbs">
          {frames.map((frame, i) => (
            <button
              key={i}
              className={`gallery-thumb${i === active ? " active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-pressed={i === active}
            >
              {frame}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
