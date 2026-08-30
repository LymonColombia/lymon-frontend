import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupplierRepository } from '@/domain/repositories/supplier.repository';
import { InventoryItem } from '@/domain/entities/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class GetSupplierItemsUseCase {
  private readonly repository = inject(SupplierRepository);

  execute(supplierId: string): Observable<InventoryItem[]> {
    return this.repository.getSupplierItems(supplierId);
  }
}
