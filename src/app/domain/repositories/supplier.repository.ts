import { Observable } from 'rxjs';
import { CreateSupplierDto, UpdateSupplierDto } from '@/infrastructure/dtos/supplier.dto';
import { Supplier } from '@/domain/entities/supplier.model';

export abstract class SupplierRepository {
  abstract createSupplier(data: CreateSupplierDto): Observable<Supplier>;
  abstract updateSupplier(data: UpdateSupplierDto): Observable<Supplier>;
  abstract deleteSupplier(id: string): Observable<void>;
  abstract getSuppliers(): Observable<Supplier[]>;
  abstract getSupplierById(id: string): Observable<Supplier>;
}
