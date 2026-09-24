import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuditLogRepository } from '@/domain/repositories/audit-log.repository';
import { AuditLogFilters, AuditLogResponse } from '@/domain/entities/audit-log.model';
import { AuditLogMapper } from '@/infrastructure/mappers/audit-log.mapper';
import { TokenService } from '@/infrastructure/services/token.service';
import { environment } from '@env';

const BASE_URL = `${environment.apiUrl}${environment.audit.endpoint}`;

@Injectable({ providedIn: 'root' })
export class AuditLogRepositoryImpl extends AuditLogRepository {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);

  private get authHeaders(): HttpHeaders {
    const token = this.tokenService.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  getAuditLogs(filters: AuditLogFilters): Observable<AuditLogResponse> {
    let params = new HttpParams();
    if (filters.page !== undefined) params = params.set('page', String(filters.page));
    if (filters.limit !== undefined) params = params.set('limit', String(filters.limit));
    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.action) params = params.set('action', filters.action);
    if (filters.entityType) params = params.set('entityType', filters.entityType);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);

    return this.http
      .get<unknown>(BASE_URL, { headers: this.authHeaders, params })
      .pipe(map((res) => AuditLogMapper.toAuditLogResponse(res)));
  }
}
