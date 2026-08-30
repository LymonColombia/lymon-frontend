import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentRepository } from '@/domain/guest/payment/payment.repository';
import { PaymentCheckoutResponse } from '@/domain/guest/payment/payment.model';

@Injectable({ providedIn: 'root' })
export class GetCheckoutPayloadUseCase {
  private readonly repository = inject(PaymentRepository);

  execute(notes?: string): Observable<PaymentCheckoutResponse> {
    return this.repository.getCheckoutPayload(notes);
  }
}
