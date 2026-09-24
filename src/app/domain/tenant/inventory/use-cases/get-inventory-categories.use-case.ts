import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryRepository } from '@/domain/tenant/inventory/inventory.repository';
import { InventoryCategory } from '@/domain/tenant/inventory/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class GetInventoryCategoriesUseCase {
  private readonly repository = inject(InventoryRepository);

  execute(): Observable<InventoryCategory[]> {
    return this.repository.getCategories();
  }
}
