import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { InventoryRepository } from '../../domain/repositories/inventory.repository';
import { CreateInventoryItemDto, InventoryItemResponse, CreateInventoryCategoryDto, InventoryCategoryResponse } from '../dtos/inventory.dto';

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
}
