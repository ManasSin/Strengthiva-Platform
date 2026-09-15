import { Suspense } from "react";
import { ProductRecordPage } from "@/components/transparency/product-record";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; productId: string }>;
}) {
  const { id, productId } = await params;
  return (
    <Suspense>
      <ProductRecordPage batchId={id} id={productId} />
    </Suspense>
  );
}
