import { Suspense } from "react";
import { ReportsPage } from "@/components/transparency/reports";
import { Loading } from "@strengthiva/transparency/ui";
export const metadata = { title: "Reports · Strengthiva" };
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ReportsPage />
    </Suspense>
  );
}
