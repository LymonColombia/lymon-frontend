import { Observable } from 'rxjs';
import { CreateSupplier, UpdateSupplier } from '@/domain/entities/supplier.model';
import { InventoryItem } from '@/domain/entities/inventory.model';
import { Supplier } from '@/domain/entities/supplier.model';

export abstract class SupplierRepository {
  abstract createSupplier(data: CreateSupplier): Observable<Supplier>;
  abstract updateSupplier(data: UpdateSupplier): Observable<Supplier>;
  abstract deleteSupplier(id: string): Observable<void>;
  abstract getSuppliers(): Observable<Supplier[]>;
  abstract getSupplierById(id: string): Observable<Supplier>;
  abstract getSupplierItems(id: string): Observable<InventoryItem[]>;
}
