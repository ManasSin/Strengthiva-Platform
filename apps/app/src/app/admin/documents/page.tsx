import { Suspense } from "react";
import { DocumentsPage } from "@/components/transparency/documents";
import { Loading } from "@strengthiva/transparency/ui";
export const metadata = { title: "Documents · Strengthiva" };
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <DocumentsPage />
    </Suspense>
  );
}
