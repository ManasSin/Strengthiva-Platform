"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ProductDetail } from "@strengthiva/transparency/types";
import { transparencyApi } from "@/lib/transparency-api";
import { useResource } from "./use-resource";
export function useBatchRecords() {
  const params = useSearchParams();
  const [chosen, setChosen] = useState(params.get("batch") || "");
  const batches = useResource("batch-options", (signal) =>
    transparencyApi.batches(signal)
  );
  const batchId =
    chosen || batches.data?.find((batch) => batch.product_count > 0)?.id || "";
  const records = useResource(`batch-records-${batchId}`, async (signal) => {
    if (!batchId) return [];
    const batch = await transparencyApi.batch(batchId, signal);
    const products: ProductDetail[] = [];
    // Keep requests bounded and retain workbook-scale usability without overwhelming the API.
    for (let index = 0; index < batch.products.length; index += 3) {
      products.push(
        ...(await Promise.all(
          batch.products
            .slice(index, index + 3)
            .map((product) => transparencyApi.product(product.id, signal))
        ))
      );
    }
    return products;
  });
  return { batches, records, batchId, setBatchId: setChosen };
}
export function BatchPicker({
  batchId,
  batches,
  onChange,
  disabled,
}: {
  batchId: string;
  batches: { id: string; batch_number: string; product_count: number }[];
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="field batch-picker">
      <span>Manufacturing batch</span>
      <select
        className="select"
        value={batchId}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Choose a batch</option>
        {batches
          .filter((batch) => batch.product_count > 0)
          .map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.batch_number} · {batch.product_count} products
            </option>
          ))}
      </select>
    </label>
  );
}
