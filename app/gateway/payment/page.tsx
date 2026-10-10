import type { Metadata } from "next";

import { PaymentGateway } from "@/components/payment/payment-gateway";
import type { PaymentEndpointQuery } from "@/types/payment";

export const metadata: Metadata = {
  title: "Thanh toán",
  description: "Thanh toán giao dịch An Tâm bằng mã QR ngân hàng.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query: PaymentEndpointQuery = {
    orderId: readParam(params, "orderId"),
    amount: readParam(params, "amount"),
    orderInfo: readParam(params, "orderInfo"),
    type: readParam(params, "type"),
    expiresAt: readParam(params, "expiresAt"),
    signature: readParam(params, "signature"),
  };

  return (
    <PaymentGateway
      key={Object.values(query).join(":")}
      query={query}
    />
  );
}
