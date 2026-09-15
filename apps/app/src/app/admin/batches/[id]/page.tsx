import { BatchDetailPage } from "@/components/transparency/batch-detail";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BatchDetailPage id={id} />;
}
