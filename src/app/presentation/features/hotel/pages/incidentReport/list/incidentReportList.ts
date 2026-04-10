import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapFileEarmarkText,
  bootstrapFileEarmarkPlus,
  bootstrapPencilSquare,
  bootstrapPlusLg,
} from '@ng-icons/bootstrap-icons';
import {
  HotelPageLayoutComponent,
  HotelPageMetaDirective,
  HotelPageActionsDirective,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { GetIncidentReportsUseCase } from '@/domain/use-cases/incident/get-incident-reports.use-case';
import { UserSessionService } from '@/infrastructure/services/user-session.service';
import { IncidentReport } from '@/domain/entities/incident-report.model';

@Component({
  selector: 'app-incident-report-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIcon,
    HotelPageLayoutComponent,
    HotelPageMetaDirective,
    HotelPageActionsDirective,
    ButtonComponent,
  ],
  providers: [
    provideIcons({
      bootstrapFileEarmarkText,
      bootstrapFileEarmarkPlus,
      bootstrapPencilSquare,
      bootstrapPlusLg,
    }),
  ],
  templateUrl: './incidentReportList.html',
  styleUrl: './incidentReportList.css',
})
export class IncidentReportListComponent implements OnInit {
  private readonly getIncidentReportsUseCase = inject(GetIncidentReportsUseCase);
  private readonly userSessionService = inject(UserSessionService);
  private readonly router = inject(Router);

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

  navigateToCreate(): void {
    this.router.navigate(['/incident-report/create']);
  }

  navigateToEdit(report: IncidentReport): void {
    this.router.navigate(['/incident-report/edit', report.id], { state: { report } });
  }
}
