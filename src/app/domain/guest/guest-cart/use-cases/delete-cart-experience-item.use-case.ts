import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestCartRepository } from '@/domain/guest/guest-cart/guest-cart.repository';
import { Cart } from '@/domain/guest/guest-cart/cart.model';

@Injectable({ providedIn: 'root' })
export class DeleteCartExperienceItemUseCase {
  private readonly repository = inject(GuestCartRepository);

  execute(experienceId: string, selectedDate: string): Observable<Cart> {
    return this.repository.deleteExperienceItem(experienceId, selectedDate);
  }
}
