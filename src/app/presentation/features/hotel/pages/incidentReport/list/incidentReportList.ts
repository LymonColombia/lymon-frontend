import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '@/presentation/shared/components/sidebar/sidebar';
import { GetIncidentReportsUseCase } from '@/domain/use-cases/get-incident-reports.use-case';
import { UserSessionService } from '@/infrastructure/services/user-session.service';
import { IncidentReport } from '@/domain/entities/incident-report.model';

@Component({
  selector: 'app-incident-report-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SidebarComponent, RouterLink],
  templateUrl: './incidentReportList.html',
  styleUrl: './incidentReportList.css',
})
export class IncidentReportListComponent implements OnInit {
  private readonly getIncidentReportsUseCase = inject(GetIncidentReportsUseCase);
  private readonly userSessionService = inject(UserSessionService);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly reports = signal<IncidentReport[]>([]);

  ngOnInit(): void {
    const propertyId = this.userSessionService.tenantId;
    if (!propertyId) {
      this.isLoading.set(false);
      this.errorMessage.set('No se pudo obtener la propiedad asociada a tu cuenta.');
      return;
    }

    this.getIncidentReportsUseCase.execute(propertyId).subscribe({
      next: (data) => {
        this.reports.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Error al cargar las novedades. Inténtalo de nuevo.');
      },
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
