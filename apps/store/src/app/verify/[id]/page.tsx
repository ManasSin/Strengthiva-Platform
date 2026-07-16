import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Heading, Text, Badge } from "@modules/common/components/ui"

// Batch certificate verification — reached by scanning the QR code printed on a
// medicine bottle. Deliberately outside [countryCode] (see middleware.ts) since
// this URL is physically printed and must never depend on region redirects.
//
// Fetches strengthiva-backend (FastAPI) directly, not Medusa — the one deliberate
// exception to this app's "talks exclusively to Medusa" rule. See
// docs/platform-architecture/tech-specs/backend/batch-certificates.md and
// 00-overview.md §2.4.

type Props = {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Batch Certificate Verification | Strengthiva",
  description: "Verify a Strengthiva medicine batch's quality certificate.",
}

type Certificate = {
  id: string
  original_filename: string
  vetted_at: string
  file_url: string
}

type BatchCertificateResponse = {
  batch_number: string
  product_name: string | null
  certificates: Certificate[]
}

async function getBatchCertificate(
  id: string
): Promise<BatchCertificateResponse | null> {
  const res = await fetch(`${process.env.FASTAPI_URL}/api/v1/certificates/${id}`, {
    cache: "no-store",
  })
  if (!res.ok) return null
  return res.json()
}

export default async function VerifyPage(props: Props) {
  const params = await props.params
  const data = await getBatchCertificate(params.id).catch(() => null)

  if (!data) {
    return notFound()
  }

  return (
    <div className="py-12 min-h-screen bg-gray-50">
      <div className="content-container max-w-2xl mx-auto flex flex-col gap-y-8">
        <div className="flex flex-col gap-y-2 items-center text-center">
          <Badge color="green">Verified</Badge>
          <Heading level="h1">Certified Batch</Heading>
          <Text className="text-gray-500">
            This batch&apos;s quality certificate has been vetted by Strengthiva.
          </Text>
        </div>

        <div className="bg-white rounded-lg border p-6 flex flex-col gap-y-4">
          <div>
            <Text className="text-gray-500 text-sm">Batch number</Text>
            <Text className="text-lg font-medium">{data.batch_number}</Text>
          </div>
          {data.product_name && (
            <div>
              <Text className="text-gray-500 text-sm">Product</Text>
              <Text className="text-lg font-medium">{data.product_name}</Text>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-y-4">
          <Heading level="h2">
            Certificate{data.certificates.length > 1 ? "s" : ""}
          </Heading>
          {data.certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-lg border p-4 flex flex-col gap-y-3"
            >
              <div className="flex items-center justify-between gap-4">
                <Text className="font-medium">{cert.original_filename}</Text>
                <a
                  href={cert.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline text-sm shrink-0"
                >
                  Download PDF
                </a>
              </div>
              <Text className="text-xs text-gray-500">
                Vetted on {new Date(cert.vetted_at).toLocaleDateString()}
              </Text>
              <iframe
                src={cert.file_url}
                className="w-full h-[500px] border rounded"
                title={cert.original_filename}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
