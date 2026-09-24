import { AuditLogEntry, AuditLogResponse } from '@/domain/entities/audit-log.model';

export class AuditLogMapper {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toAuditLogResponse(raw: any): AuditLogResponse {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (raw.data.items ?? []).map((item: any): AuditLogEntry => ({
        id: item.id,
        userId: item.userId,
        userEmail: item.userEmail,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId ?? undefined,
        metadata: item.metadata ?? undefined,
        createdAt: item.createdAt,
      })),
      total: raw.data.total,
      page: raw.data.page,
      limit: raw.data.limit,
    };
  }
}
