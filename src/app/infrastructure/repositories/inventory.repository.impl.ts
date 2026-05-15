import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env';
import { InventoryRepository } from '../../domain/repositories/inventory.repository';
import {
  CreateInventoryItemDto,
  InventoryItemResponse,
  CreateInventoryCategoryDto,
  InventoryCategoryResponse,
  InventoryCategoryListResponse,
  InventoryItemListResponse
} from '../dtos/inventory.dto';

@Injectable({
  providedIn: 'root',
})
export class InventoryRepositoryImpl extends InventoryRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  createItem(propertyId: string, data: CreateInventoryItemDto): Observable<InventoryItemResponse> {
    return this.http.post<InventoryItemResponse>(`${this.apiUrl}/properties/${propertyId}/inventory/items`, data);
  }

  createCategory(data: CreateInventoryCategoryDto): Observable<InventoryCategoryResponse> {
    return this.http.post<InventoryCategoryResponse>(`${this.apiUrl}/inventory/categories`, data);
  }

  getCategories(): Observable<InventoryCategoryResponse[]> {
    return this.http.get<InventoryCategoryListResponse>(`${this.apiUrl}/inventory/categories`).pipe(
      map(res => res.data.categories)
    );
  }

  getItems(propertyId: string): Observable<InventoryItemResponse[]> {
    return this.http.get<InventoryItemListResponse>(`${this.apiUrl}/properties/${propertyId}/inventory/items`).pipe(
      map(res => res.data)
    );
  }
}
