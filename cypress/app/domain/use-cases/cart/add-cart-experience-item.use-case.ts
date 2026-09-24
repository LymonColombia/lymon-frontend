import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestCartRepository } from '@/domain/repositories/guest-cart.repository';
import { Cart, CartExperienceItemRequest } from '@/domain/entities/cart.model';

@Injectable({ providedIn: 'root' })
export class AddCartExperienceItemUseCase {
  private readonly repository = inject(GuestCartRepository);

  execute(request: CartExperienceItemRequest): Observable<Cart> {
    return this.repository.addExperienceItem(request);
  }
}
