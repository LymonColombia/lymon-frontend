import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestCartRepository } from '@/domain/guest/guest-cart/guest-cart.repository';
import { Cart } from '@/domain/guest/guest-cart/cart.model';

@Injectable({ providedIn: 'root' })
export class GetCartUseCase {
  private readonly repository = inject(GuestCartRepository);

  execute(): Observable<Cart | null> {
    return this.repository.getCart();
  }
}
