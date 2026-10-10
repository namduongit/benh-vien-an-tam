import type { Metadata } from "next";

import { AssignedCaseDetailScreen } from "@/components/internal/trang-tong/clinical/assigned-cases-screen";

export const metadata: Metadata = { title: "Chi tiết ca khám" };

export default async function AssignedCasePage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  return <AssignedCaseDetailScreen uuid={uuid} />;
}
