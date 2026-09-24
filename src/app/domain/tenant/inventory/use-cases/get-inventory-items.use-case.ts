import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryRepository } from '@/domain/tenant/inventory/inventory.repository';
import { InventoryItem } from '@/domain/tenant/inventory/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class GetInventoryItemsUseCase {
  private readonly repository = inject(InventoryRepository);

  execute(propertyId: string): Observable<InventoryItem[]> {
    return this.repository.getItems(propertyId);
  }
}
