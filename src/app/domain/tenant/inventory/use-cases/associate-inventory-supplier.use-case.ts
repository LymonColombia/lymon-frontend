import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryRepository } from '@/domain/tenant/inventory/inventory.repository';

@Injectable({
  providedIn: 'root',
})
export class AssociateInventorySupplierUseCase {
  private readonly repository = inject(InventoryRepository);

  execute(propertyId: string, itemId: string, supplierId: string | null): Observable<void> {
    return this.repository.associateSupplier(propertyId, itemId, supplierId);
  }
}
