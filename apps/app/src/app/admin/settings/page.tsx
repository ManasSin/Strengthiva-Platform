import { Suspense } from "react";
import { SettingsPage } from "@/components/transparency/settings";
import { Loading } from "@strengthiva/transparency/ui";
export const metadata = { title: "Settings · Strengthiva" };
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SettingsPage />
    </Suspense>
  );
}
