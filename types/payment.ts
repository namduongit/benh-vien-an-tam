export type PaymentEndpointQuery = {
  orderId: string;
  amount: string;
  orderInfo: string;
  type: string;
  expiresAt: string;
  signature: string;
};

export type ResultEndpoint = {
  isValid: boolean;
  errorMessage: string | null;
  orderUuid: string;
  type: string;
  amount: number;
  content: string;
  payUrl: string;
  expiresAt: string;
};

export type PaymentApiErrorResponse = {
  message?: string;
  Message?: string;
  errors?: Partial<ResultEndpoint>;
  Errors?: Partial<ResultEndpoint> & {
    ErrorMessage?: string | null;
  };
};
