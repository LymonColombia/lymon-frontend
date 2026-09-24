import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryRepository } from '../../repositories/inventory.repository';
import { InventoryCategoryResponse } from '../../../infrastructure/dtos/inventory.dto';

@Injectable({
  providedIn: 'root',
})
export class GetInventoryCategoriesUseCase {
  private readonly repository = inject(InventoryRepository);

  execute(): Observable<InventoryCategoryResponse[]> {
    return this.repository.getCategories();
  }
}
