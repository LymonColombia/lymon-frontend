import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryRepository } from '../../repositories/inventory.repository';
import { InventoryItemResponse } from '@/infrastructure/dtos/inventory.dto';

@Injectable({
  providedIn: 'root',
})
export class GetInventoryItemsUseCase {
  private readonly repository = inject(InventoryRepository);

  execute(propertyId: string): Observable<InventoryItemResponse[]> {
    return this.repository.getItems(propertyId);
  }
}
