import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapFileEarmarkText,
  bootstrapFileEarmarkPlus,
  bootstrapPencilSquare,
  bootstrapPlusLg,
} from '@ng-icons/bootstrap-icons';
import {
  TenantPageLayoutComponent,
  TenantPageMetaDirective,
  TenantPageActionsDirective,
} from '@/presentation/tenant/layout/tenant-page-layout/tenant-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { GetIncidentReportsUseCase } from '@/domain/tenant/incident-report/use-cases/get-incident-reports.use-case';
import { GetPropertiesUseCase } from '@/domain/shared/property/use-cases/get-properties.use-case';
import { Property } from '@/domain/shared/property/property.model';
import { IncidentReport } from '@/domain/tenant/incident-report/incident-report.model';

@Component({
  selector: 'app-incident-report-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIcon,
    RouterLink,
    TenantPageLayoutComponent,
    TenantPageMetaDirective,
    TenantPageActionsDirective,
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
  templateUrl: './incident-report-list.html',
  styleUrl: './incident-report-list.css',
})
export class IncidentReportListComponent implements OnInit {
  private readonly getIncidentReportsUseCase = inject(GetIncidentReportsUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly isLoadingProperties = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly reports = signal<IncidentReport[]>([]);
  readonly properties = signal<Property[]>([]);
  readonly selectedPropertyId = signal<string>('');

  /** True once the property list has resolved to nothing usable. */
  readonly hasNoProperties = computed(
    () => !this.isLoadingProperties() && this.properties().length === 0,
  );

  ngOnInit(): void {
    this.loadProperties();
  }

  private loadProperties(): void {
    this.getPropertiesUseCase
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (props) => {
          const available = (props ?? []).filter((p) => !!p.id);
          this.properties.set(available);
          this.isLoadingProperties.set(false);

          // Default to the first property so the list is never blank on arrival.
          const firstId = available[0]?.id ?? '';
          this.selectedPropertyId.set(firstId);
          if (firstId) {
            this.loadReports(firstId);
          } else {
            this.isLoading.set(false);
          }
        },
        error: () => {
          this.isLoadingProperties.set(false);
          this.isLoading.set(false);
          this.errorMessage.set('No se pudieron cargar las propiedades de tu cuenta.');
        },
      });
  }

  onPropertyChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const propertyId = target?.value ?? '';
    this.selectedPropertyId.set(propertyId);

    if (!propertyId) {
      this.reports.set([]);
      this.isLoading.set(false);
      return;
    }

    this.loadReports(propertyId);
  }

  private loadReports(propertyId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.getIncidentReportsUseCase
      .execute(propertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    this.router.navigate(['/admin/incidents/new']);
  }

  navigateToEdit(report: IncidentReport): void {
    this.router.navigate(['/admin/incidents', report.id, 'edit'], { state: { report } });
  }
}
