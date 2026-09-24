import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestCartRepository } from '@/domain/repositories/guest-cart.repository';
import { Cart, CartReservationDraftRequest } from '@/domain/entities/cart.model';

@Injectable({ providedIn: 'root' })
export class SaveReservationDraftUseCase {
  private readonly repository = inject(GuestCartRepository);

  execute(request: CartReservationDraftRequest): Observable<Cart> {
    return this.repository.saveReservationDraft(request);
  }
}
