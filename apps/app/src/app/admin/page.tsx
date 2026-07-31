import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-y-4">
      <h1 className="text-xl font-semibold">Admin</h1>
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/knowledge-base"
          className="rounded-lg border bg-white p-6 hover:border-gray-400"
        >
          <div className="font-medium">Knowledge Base</div>
          <div className="text-sm text-gray-500 mt-1">
            Index diet-chart and product-recommendation documents used by the AI.
          </div>
        </Link>
        <Link
          href="/admin/batch-certificates"
          className="rounded-lg border bg-white p-6 hover:border-gray-400"
        >
          <div className="font-medium">Batch Certificates</div>
          <div className="text-sm text-gray-500 mt-1">
            Upload and vet batch quality certificates, generate QR codes.
          </div>
        </Link>
        <Link
          href="/admin/questionnaire"
          className="rounded-lg border bg-white p-6 hover:border-gray-400"
        >
          <div className="font-medium">Questionnaire</div>
          <div className="text-sm text-gray-500 mt-1">
            Add, edit, reorder, or hide health-assessment questions — including whole new
            disease-condition steps.
          </div>
        </Link>
        <Link
          href="/admin/products"
          className="rounded-lg border bg-white p-6 hover:border-gray-400"
        >
          <div className="font-medium">Products</div>
          <div className="text-sm text-gray-500 mt-1">
            Bulk-upload a product CSV — creates/updates catalogue items in Medusa and
            maps them to the names the AI recommends, in one step.
          </div>
        </Link>
      </div>
    </div>
  );
}
