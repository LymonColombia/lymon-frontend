import { Observable } from 'rxjs';
import { Cart, CartExperienceItemRequest, CartReservationDraftRequest } from '@/domain/entities/cart.model';

export abstract class GuestCartRepository {
  abstract saveReservationDraft(request: CartReservationDraftRequest): Observable<Cart>;
  abstract addExperienceItem(request: CartExperienceItemRequest): Observable<Cart>;
  abstract getCart(): Observable<Cart | null>;
  abstract deleteExperienceItem(experienceId: string, selectedDate: string): Observable<Cart>;
}
