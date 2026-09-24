import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryRepository } from '../../repositories/inventory.repository';
import { CreateInventoryCategoryDto, InventoryCategoryResponse } from '../../../infrastructure/dtos/inventory.dto';

@Injectable({
  providedIn: 'root',
})
export class CreateInventoryCategoryUseCase {
  private readonly repository = inject(InventoryRepository);

  execute(data: CreateInventoryCategoryDto): Observable<InventoryCategoryResponse> {
    return this.repository.createCategory(data);
  }
}
