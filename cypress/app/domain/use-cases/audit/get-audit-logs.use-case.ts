import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditLogRepository } from '@/domain/repositories/audit-log.repository';
import { AuditLogFilters, AuditLogResponse } from '@/domain/entities/audit-log.model';

@Injectable({ providedIn: 'root' })
export class GetAuditLogsUseCase {
  private readonly repo = inject(AuditLogRepository);

  execute(filters: AuditLogFilters): Observable<AuditLogResponse> {
    return this.repo.getAuditLogs(filters);
  }
}
