import { Observable } from 'rxjs';
import { CreateInventoryItemDto, InventoryItemResponse, CreateInventoryCategoryDto, InventoryCategoryResponse } from '@/infrastructure/dtos/inventory.dto';

export abstract class InventoryRepository {
  abstract createItem(propertyId: string, data: CreateInventoryItemDto): Observable<InventoryItemResponse>;
  abstract createCategory(data: CreateInventoryCategoryDto): Observable<InventoryCategoryResponse>;
  abstract getCategories(): Observable<InventoryCategoryResponse[]>;
  abstract getItems(propertyId: string): Observable<InventoryItemResponse[]>;
  abstract associateSupplier(propertyId: string, itemId: string, supplierId: string | null): Observable<void>;
}
