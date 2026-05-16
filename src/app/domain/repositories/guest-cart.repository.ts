import { Observable } from 'rxjs';
import { Cart, CartExperienceItemRequest, CartReservationDraftRequest } from '../entities/cart.model';

export abstract class GuestCartRepository {
  abstract saveReservationDraft(request: CartReservationDraftRequest): Observable<Cart>;
  abstract addExperienceItem(request: CartExperienceItemRequest): Observable<Cart>;
  abstract getCart(): Observable<Cart | null>;
}
