import { Observable } from 'rxjs';
import { AuditLogFilters, AuditLogResponse } from '@/domain/entities/audit-log.model';

export abstract class AuditLogRepository {
  abstract getAuditLogs(filters: AuditLogFilters): Observable<AuditLogResponse>;
}
