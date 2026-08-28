import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IncidentReportRepository } from '@/domain/repositories/incident-report.repository';
import {
  UpdateIncidentReportRequest,
  UpdateIncidentReportResponse,
} from '@/domain/entities/incident-report.model';

@Injectable({ providedIn: 'root' })
export class UpdateIncidentReportUseCase {
  private readonly incidentReportRepository = inject(IncidentReportRepository);

  execute(id: string, data: UpdateIncidentReportRequest): Observable<UpdateIncidentReportResponse> {
    return this.incidentReportRepository.update(id, data);
  }
}
