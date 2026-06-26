import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapBuilding, bootstrapCalendar3, bootstrapCash, bootstrapClock, bootstrapDashCircle, bootstrapFlag, bootstrapGeoAlt, bootstrapPencilSquare, bootstrapPeopleFill, bootstrapSignpost, bootstrapStar } from '@ng-icons/bootstrap-icons';
import { Experience } from '@/domain/entities/experience.model';
import {
  HotelPageActionsDirective,
  HotelPageLayoutComponent
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { GetExperienceByIdUseCase } from '@/domain/use-cases/experience/get-experience-by-id.use-case';
import { LocationMap } from "@/presentation/features/hotel/components/location-map/location-map";
import { formatDayList, formatCurrencyCop, getCategoryLabel } from '../../models/experience-form.model';
@Component({
  selector: 'app-tenant-experience-detail-page',
  standalone: true,
  imports: [
    HotelPageLayoutComponent,
    HotelPageActionsDirective,
    ButtonComponent,
    NgIcon,
    LocationMap
],
  providers: [provideIcons({ bootstrapStar, bootstrapPencilSquare , bootstrapCash,bootstrapClock,bootstrapPeopleFill,bootstrapCalendar3,bootstrapDashCircle,bootstrapBuilding,bootstrapGeoAlt,bootstrapFlag,bootstrapSignpost})],
  templateUrl: './tenant-experience-detail-page.component.html',
  styleUrl: './tenant-experience-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantExperienceDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly getExperienceByIdUseCase = inject(GetExperienceByIdUseCase);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly experience = signal<Experience | null>(null);


  readonly durationLabel = computed(() => {
    const item = this.experience();
    const durationHours = item?.durationHours;
    if (durationHours == null) {
      return 'No especificada';
    }
    return `${durationHours}h`;
  });

  readonly minCapacityLabel = computed(() => {
    const item = this.experience();
    const minCapacity = item?.minCapacity 
    return minCapacity === null ?  'No especificada':`${minCapacity}`;
  });

  readonly associationPropertyLabel = computed(() => {
    const item = this.experience();
    if (!item) return 'No asociada';
    return item.propertyName ?? item.propertyId ?? 'No asociada';
  });
  
  readonly associatedUnitLabels = computed(() => {
    const item = this.experience();
    if (!item) return [];

    if (item.units?.length) {
      return item.units.map((unit) => unit.name);
    }

    return item.unitIds ?? [];
  });

  readonly hasAssociation = computed(() => {
    const item = this.experience();
    return Boolean(item?.propertyId || item?.unitIds?.length );
  });

  readonly availabilityTypeLabel = computed(() => {
    const type = this.experience()?.availabilityType;
    if (type === 'DATE_RANGE') return 'Rango de fechas';
    if (type === 'RECURRING') return 'Recurrencia';
    if (type === 'ONE_TIME') return 'Una sola vez';
    return 'No especificada';
  });

  readonly categoryLabel = computed(() => {
    const item = this.experience();
    return item ? getCategoryLabel(item.category) : '';
  });

  readonly priceLabel = computed(() => {
    const item = this.experience();
    return item ? formatCurrencyCop(item.priceCop) : '';
  });


  constructor() {
    this.loadExperience();
  }

  onEdit(): void {
    const item = this.experience();
    if (!item?.id) {
      return;
    }

    this.router.navigate(['/tenant-experiences', item.id, 'edit']);
  }

  private loadExperience(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('No se encontro el identificador de la experiencia.');
      this.isLoading.set(false);
      return;
    }

    this.getExperienceByIdUseCase.execute(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (experience) => {
          this.experience.set(experience);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('No se pudo cargar la experiencia.');
          this.isLoading.set(false);
        },
      });
  }

  formatDateTime(value?: string): string {
    if (!value) {
      return 'Sin fecha';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  dayLabel(day: number): string {
    return formatDayList([day]);
  }
}
