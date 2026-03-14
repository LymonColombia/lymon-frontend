import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PropertyRepository } from '@/domain/repositories/property.repository';
import { CreatePropertyDto, CreateUnitDto } from '@/domain/entities/property.model';
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
}
