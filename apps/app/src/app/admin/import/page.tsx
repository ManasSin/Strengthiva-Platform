import { Suspense } from "react";
import { ImportWorkbookPage } from "@/components/transparency/import-workbook";
import { Loading } from "@strengthiva/transparency/ui";
export const metadata = { title: "Import · Strengthiva" };
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ImportWorkbookPage />
    </Suspense>
  );
}
