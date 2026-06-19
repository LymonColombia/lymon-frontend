export interface CreateIncidentReportRequest {
  title: string;
  description: string;
  propertyId: string;
}

export interface IncidentReport {
  id: string;
  title: string;
  description: string;
  propertyId: string;
  tenantId?: string;
  createdAt: string;
  createdBy?: string;
  attachmentUrls?: string[];
}

export interface CreateIncidentReportResponse {
  message: string;
  data: IncidentReport;
}

export interface GetIncidentReportsResponse {
  data: IncidentReport[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateIncidentReportRequest {
  title?: string;
  description?: string;
  attachmentUrls?: string[];
}

export interface UpdateIncidentReportResponse {
  message: string;
  data: IncidentReport;
}
