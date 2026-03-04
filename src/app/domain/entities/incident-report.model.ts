export interface CreateIncidentReportRequest {
  title: string;
  description: string;
  propertyId: string;
}

export interface IncidentReport {
  _id: string;
  title: string;
  description: string;
  propertyId: string;
  createdAt: string;
  createdBy?: string;
}

export interface CreateIncidentReportResponse {
  message: string;
  data: IncidentReport;
}

export interface GetIncidentReportsResponse {
  data: IncidentReport[];
}
