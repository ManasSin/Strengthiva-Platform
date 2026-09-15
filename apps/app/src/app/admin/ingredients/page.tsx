import { Suspense } from "react";
import { IngredientsPage } from "@/components/transparency/ingredients";
import { Loading } from "@strengthiva/transparency/ui";
export const metadata = { title: "Ingredients · Strengthiva" };
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <IngredientsPage />
    </Suspense>
  );
}
