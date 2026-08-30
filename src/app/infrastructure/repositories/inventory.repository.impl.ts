import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env';
import { InventoryRepository } from '@/domain/tenant/inventory/inventory.repository';
import {
  CreateInventoryCategory,
  CreateInventoryItem,
  InventoryCategory,
  InventoryItem,
} from '@/domain/tenant/inventory/inventory.model';
import { InventoryCategoryListResponse, InventoryItemListResponse } from '@/infrastructure/dtos/inventory.dto';

@Injectable({
  providedIn: 'root',
})
export class InventoryRepositoryImpl extends InventoryRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  createItem(propertyId: string, data: CreateInventoryItem): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.apiUrl}/properties/${propertyId}/inventory/items`, data);
  }

  createCategory(data: CreateInventoryCategory): Observable<InventoryCategory> {
    return this.http.post<InventoryCategory>(`${this.apiUrl}/inventory/categories`, data);
  }

  getCategories(): Observable<InventoryCategory[]> {
    return this.http.get<InventoryCategoryListResponse>(`${this.apiUrl}/inventory/categories`).pipe(
      map(res => res.data.categories)
    );
  }

  getItems(propertyId: string): Observable<InventoryItem[]> {
    return this.http.get<InventoryItemListResponse>(`${this.apiUrl}/properties/${propertyId}/inventory/items`).pipe(
      map(res => res.data)
    );
  }

  associateSupplier(propertyId: string, itemId: string, supplierId: string | null): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/properties/${propertyId}/inventory/items/${itemId}/supplier`, { supplierId });
  }

  deleteItem(propertyId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/properties/${propertyId}/inventory/items/${itemId}`);
  }
}
