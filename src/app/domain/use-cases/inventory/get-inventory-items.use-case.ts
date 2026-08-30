import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryRepository } from '@/domain/repositories/inventory.repository';
import { InventoryItem } from '@/domain/entities/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class GetInventoryItemsUseCase {
  private readonly repository = inject(InventoryRepository);

  execute(propertyId: string): Observable<InventoryItem[]> {
    return this.repository.getItems(propertyId);
  }
}
