import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierRepository } from '@/domain/tenant/supplier/supplier.repository';
import { InventoryItem } from '@/domain/tenant/inventory/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class GetSupplierItemsUseCase {
  private readonly repository = inject(SupplierRepository);

  execute(supplierId: string): Observable<InventoryItem[]> {
    return this.repository.getSupplierItems(supplierId);
  }
}
