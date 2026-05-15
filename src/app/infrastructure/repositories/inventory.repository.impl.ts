import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { InventoryRepository } from '../../domain/repositories/inventory.repository';
import { CreateInventoryItemDto, InventoryItemResponse } from '../dtos/inventory.dto';

@Injectable({
  providedIn: 'root',
})
export class InventoryRepositoryImpl extends InventoryRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/properties`;

  createItem(propertyId: string, data: CreateInventoryItemDto): Observable<InventoryItemResponse> {
    return this.http.post<InventoryItemResponse>(`${this.apiUrl}/${propertyId}/inventory/items`, data);
  }
}
