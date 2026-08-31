import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentRepository } from '@/domain/guest/payment/payment.repository';
import { GetPaymentSessionStatusResult } from '@/domain/guest/payment/payment.model';

@Injectable({ providedIn: 'root' })
export class GetPaymentStatusUseCase {
  private readonly repository = inject(PaymentRepository);

  execute(reference: string): Observable<GetPaymentSessionStatusResult> {
    return this.repository.getStatus(reference);
  }
}
