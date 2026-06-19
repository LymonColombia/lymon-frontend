import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentRepository } from '../../repositories/payment.repository';
import { PaymentCheckoutResponse } from '../../entities/payment.model';

@Injectable({ providedIn: 'root' })
export class GetCheckoutPayloadUseCase {
  private readonly repository = inject(PaymentRepository);

  execute(notes?: string): Observable<PaymentCheckoutResponse> {
    return this.repository.getCheckoutPayload(notes);
  }
}
