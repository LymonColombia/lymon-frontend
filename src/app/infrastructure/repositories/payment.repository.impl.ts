import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { PaymentRepository } from '@/domain/guest/payment/payment.repository';
import { GetPaymentSessionStatusResult, PaymentCheckoutResponse } from '@/domain/guest/payment/payment.model';
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';

@Injectable({ providedIn: 'root' })
export class PaymentRepositoryImpl implements PaymentRepository {
  private readonly http = inject(HttpClient);
  private readonly guestTokenService = inject(GuestTokenService);

  private readonly baseUrl = `${environment.apiUrl}/guest/cart/checkout`;

  private authHeaders(): HttpHeaders {
    const token = this.guestTokenService.getAccessToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  getCheckoutPayload(notes?: string): Observable<PaymentCheckoutResponse> {
    const body: Record<string, unknown> = {};
    if (notes) body['notes'] = notes;
    return this.http.post<PaymentCheckoutResponse>(this.baseUrl, body, { headers: this.authHeaders() });
  }

  getStatus(reference: string): Observable<GetPaymentSessionStatusResult> {
    return this.http.get<GetPaymentSessionStatusResult>(`${this.baseUrl}/status/${encodeURIComponent(reference)}`, {
      headers: this.authHeaders(),
    });
  }
}
