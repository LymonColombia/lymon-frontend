import { Observable } from 'rxjs';
import { GetPaymentSessionStatusResult, PaymentCheckoutResponse } from '@/domain/guest/payment/payment.model';

export abstract class PaymentRepository {
  abstract getCheckoutPayload(notes?: string): Observable<PaymentCheckoutResponse>;
  abstract getStatus(reference: string): Observable<GetPaymentSessionStatusResult>;
}
