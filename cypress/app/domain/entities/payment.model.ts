export interface PaymentCheckoutResponse {
  publicKey: string;
  signatureIntegrity: string;
  amountInCents: number;
  currency: 'COP';
  reference: string;
  redirectUrl?: string;
  customerData: {
    name: string;
    email: string;
    legalIdType: 'CC' | 'CE' | 'NIT' | 'PP';
    legalIdNumber?: string;
  };
  metadata?: Record<string, string>;
}

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED' | 'VOIDED' | 'ERROR';

export interface GetPaymentSessionStatusResult {
  reference: string;
  status: PaymentStatus;
  amountInCents: number;
  currency: 'COP';
  providerReference: string | null;
  updatedAt: string; // ISO
  isTerminal: boolean;
}
