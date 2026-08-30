import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryRepository } from '@/domain/repositories/inventory.repository';
import { CreateInventoryItem, InventoryItem } from '@/domain/entities/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class CreateInventoryItemUseCase {
  private readonly repository = inject(InventoryRepository);

  execute(propertyId: string, data: CreateInventoryItem): Observable<InventoryItem> {
    return this.repository.createItem(propertyId, data);
  }
}
