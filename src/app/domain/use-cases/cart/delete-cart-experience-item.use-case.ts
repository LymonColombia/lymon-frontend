import { inject, Injectable } from '@angular/core';
import { GuestCartRepository } from '@/domain/repositories/guest-cart.repository';

@Injectable({ providedIn: 'root' })
export class DeleteCartExperienceItemUseCase {
  private readonly repository = inject(GuestCartRepository);

  execute( experienceId: string , selectedDate:string): void {
    return this.repository.deleteExperienceItem(experienceId,selectedDate);
  }
}
