import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IncidentReportRepository } from '@/domain/repositories/incident-report.repository';
import { IncidentReport } from '@/domain/entities/incident-report.model';

@Injectable({ providedIn: 'root' })
export class GetIncidentReportsUseCase {
  private readonly incidentReportRepository = inject(IncidentReportRepository);

  execute(propertyId: string): Observable<IncidentReport[]> {
    return this.incidentReportRepository
      .getAll(propertyId)
      .pipe(map((res) => res.data));
  }
}
