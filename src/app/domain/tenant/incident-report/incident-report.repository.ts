import { Observable } from 'rxjs';
import {
  CreateIncidentReportRequest,
  CreateIncidentReportResponse,
  GetIncidentReportsResponse,
  UpdateIncidentReportRequest,
  UpdateIncidentReportResponse,
} from '@/domain/tenant/incident-report/incident-report.model';

export abstract class IncidentReportRepository {
  abstract create(data: CreateIncidentReportRequest): Observable<CreateIncidentReportResponse>;
  abstract getAll(propertyId: string): Observable<GetIncidentReportsResponse>;
  abstract update(id: string, data: UpdateIncidentReportRequest): Observable<UpdateIncidentReportResponse>;
}
