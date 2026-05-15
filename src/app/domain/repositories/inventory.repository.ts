import { Observable } from 'rxjs';
import { CreateInventoryItemDto, InventoryItemResponse } from '@/infrastructure/dtos/inventory.dto';

export abstract class InventoryRepository {
  abstract createItem(propertyId: string, data: CreateInventoryItemDto): Observable<InventoryItemResponse>;
}
