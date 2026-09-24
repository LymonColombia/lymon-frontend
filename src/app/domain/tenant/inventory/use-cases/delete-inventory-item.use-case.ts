import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryRepository } from '@/domain/tenant/inventory/inventory.repository';

@Injectable({
  providedIn: 'root',
})
export class DeleteInventoryItemUseCase {
  private readonly inventoryRepository = inject(InventoryRepository);

  execute(propertyId: string, itemId: string): Observable<void> {
    return this.inventoryRepository.deleteItem(propertyId, itemId);
  }
}
