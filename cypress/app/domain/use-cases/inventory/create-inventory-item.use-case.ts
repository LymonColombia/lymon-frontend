import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryRepository } from '../../repositories/inventory.repository';
import { CreateInventoryItemDto, InventoryItemResponse } from '../../../infrastructure/dtos/inventory.dto';

@Injectable({
  providedIn: 'root',
})
export class CreateInventoryItemUseCase {
  private readonly repository = inject(InventoryRepository);

  execute(propertyId: string, data: CreateInventoryItemDto): Observable<InventoryItemResponse> {
    return this.repository.createItem(propertyId, data);
  }
}
