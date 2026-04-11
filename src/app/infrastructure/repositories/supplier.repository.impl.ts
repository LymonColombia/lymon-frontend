import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { SupplierRepository } from '@/domain/repositories/supplier.repository';
import { CreateSupplierDto, SupplierDto, UpdateSupplierDto } from '@/infrastructure/dtos/supplier.dto';
import { Supplier } from '@/domain/entities/supplier.model';
import { environment } from '@env';

const BASE_URL = `${environment.apiUrl}/suppliers`;

@Injectable({ providedIn: 'root' })
export class SupplierRepositoryImpl extends SupplierRepository {
  private readonly http = inject(HttpClient);

  createSupplier(data: CreateSupplierDto): Observable<Supplier> {
    return this.http.post<SupplierDto>(BASE_URL, data).pipe(
      map((dto) => this.mapDtoToSupplier(dto)),
    );
  }

  updateSupplier(data: UpdateSupplierDto): Observable<Supplier> {
    const { id, ...updateData } = data;
    return this.http.put<SupplierDto>(`${BASE_URL}/${id}`, updateData).pipe(
      map((dto) => this.mapDtoToSupplier(dto)),
    );
  }

  deleteSupplier(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/${id}`);
  }

  getSuppliers(): Observable<Supplier[]> {
    return this.http
      .get<{ data: SupplierDto[] }>(BASE_URL)
      .pipe(map((res) => res.data.map((dto) => this.mapDtoToSupplier(dto))));
  }

  getSupplierById(id: string): Observable<Supplier> {
    return this.http
      .get<SupplierDto>(`${BASE_URL}/${id}`)
      .pipe(map((dto) => this.mapDtoToSupplier(dto)));
  }

  private mapDtoToSupplier(dto: SupplierDto): Supplier {
    return {
      id: dto.id,
      name: dto.name,
      nit: dto.nit,
      city: dto.city,
      country: dto.country,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
    };
  }
}
