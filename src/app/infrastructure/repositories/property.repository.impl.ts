import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PropertyRepository } from '@/domain/repositories/property.repository';
import { CreatePropertyDto, CreateUnitDto, PropertyDetail, UpdatePropertyDto, UpdateUnitDto, UpdateUnitMediaKeysDto } from '@/domain/entities/property.model';
import { Unit, UnitResponse } from '@/domain/entities/staff.model';
import { TokenService } from '@/infrastructure/services/token.service';
import { environment } from '@env';

@Injectable({ providedIn: 'root' })
export class PropertyRepositoryImpl extends PropertyRepository {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);

  private get authHeaders(): HttpHeaders {
    const token = this.tokenService.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  createProperty(data: CreatePropertyDto): Observable<unknown> {
    return this.http.post<unknown>(
      `${environment.apiUrl}${environment.properties.endpoint}`,
      data,
      { headers: this.authHeaders },
    );
  }

  createUnit(data: CreateUnitDto): Observable<unknown> {
    return this.http.post<unknown>(`${environment.apiUrl}${environment.units.endpoint}`, data, {
      headers: this.authHeaders,
    });
  }

  getPropertyById(id: string): Observable<PropertyDetail> {
    return this.http.get<{ data: PropertyDetail }>(
      `${environment.apiUrl}${environment.properties.endpoint}/${id}`,
      { headers: this.authHeaders },
    ).pipe(map(res => res.data));
  }

  updateProperty(id: string, data: UpdatePropertyDto): Observable<unknown> {
    return this.http.patch<unknown>(
      `${environment.apiUrl}${environment.properties.endpoint}/${id}`,
      data,
      { headers: this.authHeaders },
    );
  }

  deleteProperty(id: string): Observable<unknown> {
    return this.http.delete<unknown>(
      `${environment.apiUrl}${environment.properties.endpoint}/${id}`,
      { headers: this.authHeaders },
    );
  }

  updateUnitMediaKeys(id: string, data: UpdateUnitMediaKeysDto): Observable<unknown> {
    return this.http.patch<unknown>(
      `${environment.apiUrl}${environment.units.endpoint}/${id}`,
      data,
      { headers: this.authHeaders },
    );
  }

  updateUnit(id: string, data: UpdateUnitDto): Observable<unknown> {
    return this.http.patch<unknown>(
      `${environment.apiUrl}${environment.units.endpoint}/${id}`,
      data,
      { headers: this.authHeaders },
    );
  }

  deleteUnit(id: string): Observable<unknown> {
    return this.http.delete<unknown>(
      `${environment.apiUrl}${environment.units.endpoint}/${id}`,
      { headers: this.authHeaders },
    );
  }

  getUnitById(id: string): Observable<Unit> {
    return this.http.get<UnitResponse>(
      `${environment.apiUrl}${environment.units.unitDetailEndpoint}/${id}`,
      { headers: this.authHeaders },
    ).pipe(map(res => res.data.unit));
  }
}
