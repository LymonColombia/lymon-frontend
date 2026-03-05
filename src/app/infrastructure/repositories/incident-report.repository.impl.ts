import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IncidentReportRepository } from '@/domain/repositories/incident-report.repository';
import {
  CreateIncidentReportRequest,
  CreateIncidentReportResponse,
  GetIncidentReportsResponse,
  UpdateIncidentReportRequest,
  UpdateIncidentReportResponse,
} from '@/domain/entities/incident-report.model';
import { environment } from '@env';

const BASE_URL = `${environment.apiUrl}${environment.incidentReport.endpoint}`;

@Injectable({ providedIn: 'root' })
export class IncidentReportRepositoryImpl extends IncidentReportRepository {
  private readonly http = inject(HttpClient);

  create(data: CreateIncidentReportRequest): Observable<CreateIncidentReportResponse> {
    return this.http.post<CreateIncidentReportResponse>(BASE_URL, data);
  }

  getAll(propertyId: string): Observable<GetIncidentReportsResponse> {
    return this.http.get<GetIncidentReportsResponse>(
      `${BASE_URL}/by-property/${propertyId}`,
    );
  }

  update(id: string, data: UpdateIncidentReportRequest): Observable<UpdateIncidentReportResponse> {
    return this.http.patch<UpdateIncidentReportResponse>(`${BASE_URL}/${id}`, data);
  }
}
