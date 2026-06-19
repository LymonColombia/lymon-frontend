import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierRepository } from '../../repositories/supplier.repository';
import { InventoryItemResponse } from '@/infrastructure/dtos/inventory.dto';

@Injectable({
  providedIn: 'root',
})
export class GetSupplierItemsUseCase {
  private readonly repository = inject(SupplierRepository);

  execute(supplierId: string): Observable<InventoryItemResponse[]> {
    return this.repository.getSupplierItems(supplierId);
  }
}
