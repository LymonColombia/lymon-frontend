import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryRepository } from '@/domain/tenant/inventory/inventory.repository';
import { CreateInventoryCategory, InventoryCategory } from '@/domain/tenant/inventory/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class CreateInventoryCategoryUseCase {
  private readonly repository = inject(InventoryRepository);

  execute(data: CreateInventoryCategory): Observable<InventoryCategory> {
    return this.repository.createCategory(data);
  }
}
