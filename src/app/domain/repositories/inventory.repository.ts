import { Observable } from 'rxjs';
import { CreateInventoryItem, InventoryItem, CreateInventoryCategory, InventoryCategory } from '@/domain/entities/inventory.model';

export abstract class InventoryRepository {
  abstract createItem(propertyId: string, data: CreateInventoryItem): Observable<InventoryItem>;
  abstract createCategory(data: CreateInventoryCategory): Observable<InventoryCategory>;
  abstract getCategories(): Observable<InventoryCategory[]>;
  abstract getItems(propertyId: string): Observable<InventoryItem[]>;
  abstract associateSupplier(propertyId: string, itemId: string, supplierId: string | null): Observable<void>;
  abstract deleteItem(propertyId: string, itemId: string): Observable<void>;
}
