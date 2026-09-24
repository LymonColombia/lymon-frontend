import { Observable } from 'rxjs';
import { GetPaymentSessionStatusResult, PaymentCheckoutResponse } from '../entities/payment.model';

export abstract class PaymentRepository {
  abstract getCheckoutPayload(notes?: string): Observable<PaymentCheckoutResponse>;
  abstract getStatus(reference: string): Observable<GetPaymentSessionStatusResult>;
}
