import { Observable } from 'rxjs';
import { AuditLogFilters, AuditLogResponse } from '@/domain/tenant/audit-log/audit-log.model';

export abstract class AuditLogRepository {
  abstract getAuditLogs(filters: AuditLogFilters): Observable<AuditLogResponse>;
}
