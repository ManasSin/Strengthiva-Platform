import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  PublicChrome,
  PublicRecord,
} from "@strengthiva/transparency/public-record"
import { Icon, Status } from "@strengthiva/transparency/ui"
import type { PublicRecord as PublicData } from "@strengthiva/transparency/types"
import "@strengthiva/transparency/styles.css"

// This URL is printed on packaging and intentionally lives outside [countryCode].
export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Product transparency | Strengthiva",
  description:
    "Manufacturing details, ingredient traceability, and recorded quality evidence for a Strengthiva product and batch.",
  robots: { index: false, follow: false },
}
const api = process.env.FASTAPI_URL || "http://localhost:8000"
async function read(path: string) {
  return fetch(`${api}/api/v1/${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  })
}
type LegacyRecord = {
  product_name: string | null
  batch_number: string
  certificates: { id: string; original_filename: string; file_url: string }[]
}
export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id))
    notFound()
  const response = await read(`transparency/${id}`)
  if (response.ok) {
    const data: PublicData = await response.json()
    return (
      <PublicChrome>
        <PublicRecord data={data} />
      </PublicChrome>
    )
  }
  if (response.status !== 404)
    throw new Error("The record service is temporarily unavailable.")
  // Preserve QR codes printed before the product-level platform. A legacy batch
  // cannot be mistaken for a new unpublished batch-product (distinct UUIDs).
  const legacyResponse = await read(`certificates/${id}`)
  if (legacyResponse.status === 404) notFound()
  if (!legacyResponse.ok)
    throw new Error("The record service is temporarily unavailable.")
  const legacy: LegacyRecord = await legacyResponse.json()
  return (
    <PublicChrome>
      <div className="public-main" id="product-record">
        <section className="public-section">
          <Status tone="good" icon="check">
            Published batch certificate
          </Status>
          <h1 className="legacy-title">
            {legacy.product_name || "Batch certificate"}
          </h1>
          <p className="mono">{legacy.batch_number}</p>
          <p>
            This previously issued QR code links to the batch’s published
            certificates.
          </p>
        </section>
        <section className="public-section">
          <div className="public-section-head">
            <h2>Published certificates</h2>
          </div>
          <div className="public-docs">
            {legacy.certificates.map((cert) => (
              <a
                className="public-doc"
                key={cert.id}
                href={cert.file_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="file" />
                <div>
                  <strong>{cert.original_filename}</strong>
                  <span>View / download PDF</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </PublicChrome>
  )
}
