declare module "paystack" {
  interface PaystackInitializeOptions {
    amount: number;
    email: string;
    name?: string; // Optional but recommended
    currency: string;
    reference: string;
    metadata?: string; // JSON string
    callback_url?: string;
    channels?: string[];
    // ... other potential options
  }

  interface PaystackInitializeResponseData {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
  }

  interface PaystackVerifyResponseData {
    status?: string;
    gateway_response?: string;
    amount?: number;
    paid_at?: string | Date;
    metadata?: unknown;
    // ... other potential fields
  }

  interface PaystackResponse {
    status: boolean;
    message: string;
    data?: unknown; // Generic data, can be refined per method
  }

  interface PaystackTransactionAPI {
    initialize(
      options: PaystackInitializeOptions
    ): Promise<PaystackResponse & { data?: PaystackInitializeResponseData }>;
    verify(
      reference: string
    ): Promise<PaystackResponse & { data?: PaystackVerifyResponseData }>;
    // ... other transaction methods if needed (charge, etc.)
  }

  interface PaystackInstance {
    transaction: PaystackTransactionAPI;
    // Add other APIs like customer, plan, etc. if used
    initialize(
      options: PaystackInitializeOptions
    ): Promise<PaystackResponse & { data?: PaystackInitializeResponseData }>;
    verify(
      reference: string
    ): Promise<PaystackResponse & { data?: PaystackVerifyResponseData }>;
  }

  function paystack(secretKey: string): PaystackInstance;
  export default paystack;
}
