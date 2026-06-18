export type AuditAction =
  | 'AUTH_LOGIN'
  | 'TENANT_REGISTERED'
  | 'TENANT_PROFILE_UPDATED'
  | 'USER_INVITED'
  | 'USER_PASSWORD_CHANGED'
  | 'USER_EMAIL_VERIFIED'
  | 'PROPERTY_CREATED'
  | 'PROPERTY_UPDATED'
  | 'PROPERTY_DELETED'
  | 'UNIT_CREATED'
  | 'UNIT_UPDATED'
  | 'UNIT_DELETED'
  | 'INCIDENT_REPORT_CREATED'
  | 'INCIDENT_REPORT_UPDATED'
  | 'INCIDENT_REPORT_DELETED';

export type AuditEntityType =
  | 'AUTH'
  | 'TENANT'
  | 'USER'
  | 'PROPERTY'
  | 'UNIT'
  | 'INCIDENT_REPORT';

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  userId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  dateFrom?: string;
  dateTo?: string;
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}
