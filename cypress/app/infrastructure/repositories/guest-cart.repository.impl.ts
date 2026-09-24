import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { GuestCartRepository } from '@/domain/repositories/guest-cart.repository';
import { Cart, CartExperienceItemRequest, CartReservationDraftRequest } from '@/domain/entities/cart.model';
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';

const BASE_URL = `${environment.apiUrl}/guest/cart`;

@Injectable({ providedIn: 'root' })
export class GuestCartRepositoryImpl implements GuestCartRepository {
  private readonly http = inject(HttpClient);
  private readonly guestTokenService = inject(GuestTokenService);

  private authHeaders(): HttpHeaders {
    const token = this.guestTokenService.getAccessToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  saveReservationDraft(request: CartReservationDraftRequest): Observable<Cart> {
    return this.http.post<Cart>(`${BASE_URL}/reservation`, request, { headers: this.authHeaders() });
  }

  addExperienceItem(request: CartExperienceItemRequest): Observable<Cart> {
    return this.http.post<Cart>(`${BASE_URL}/items`, request, { headers: this.authHeaders() });
  }

  getCart(): Observable<Cart | null> {
    return this.http.get<Cart | null>(BASE_URL, { headers: this.authHeaders() });
  }
}
