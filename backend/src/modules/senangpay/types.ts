export interface SenangPayOptions {
  merchantId: string;
  secretKey: string;
  sandbox?: boolean;
}

export const PaymentProviderKeys = {
  SENANGPAY: "senangpay",
} as const;

export const ErrorCodes = {
  INVALID_HASH: "invalid_hash",
  PAYMENT_FAILED: "payment_failed",
} as const;
