import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IncidentReportRepository } from '@/domain/repositories/incident-report.repository';
import {
  CreateIncidentReportRequest,
  CreateIncidentReportResponse,
} from '@/domain/entities/incident-report.model';

@Injectable({ providedIn: 'root' })
export class CreateIncidentReportUseCase {
  private readonly incidentReportRepository = inject(IncidentReportRepository);

  execute(data: CreateIncidentReportRequest): Observable<CreateIncidentReportResponse> {
    return this.incidentReportRepository.create(data);
  }
}
