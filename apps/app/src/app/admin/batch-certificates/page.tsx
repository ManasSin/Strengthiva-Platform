import { redirect } from "next/navigation";

// The former certificate workflow now lives in the product-transparency
// workspace. The underlying API remains available for existing integrations.
export default function BatchCertificatesPage() {
  redirect("/admin/batches");
}
