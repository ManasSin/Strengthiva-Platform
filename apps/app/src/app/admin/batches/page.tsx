import { Suspense } from "react";
import { BatchesPage } from "@/components/transparency/batches";
import { Loading } from "@strengthiva/transparency/ui";
export const metadata = { title: "Batches · Strengthiva" };
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <BatchesPage />
    </Suspense>
  );
}
