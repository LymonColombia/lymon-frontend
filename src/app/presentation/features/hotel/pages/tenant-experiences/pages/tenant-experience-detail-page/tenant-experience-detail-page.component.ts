import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapBuilding, bootstrapCalendar3, bootstrapCash, bootstrapGeoAlt, bootstrapImages, bootstrapPencilSquare, bootstrapPeopleFill, bootstrapStar } from '@ng-icons/bootstrap-icons';
import { Experience } from '@/domain/entities/experience.model';
import {
  HotelPageActionsDirective,
  HotelPageLayoutComponent,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { GetExperienceByIdUseCase } from '@/domain/use-cases/experience/get-experience-by-id.use-case';
import { coverImageOf } from '@/presentation/shared/utils/media.util';
import { formatCurrencyCop, formatDayList, getCategoryLabel } from '../../models/experience-form.model';

@Component({
  selector: 'app-tenant-experience-detail-page',
  standalone: true,
  imports: [HotelPageLayoutComponent, HotelPageActionsDirective, ButtonComponent, NgIcon],
  providers: [
    provideIcons({
      bootstrapStar,
      bootstrapPencilSquare,
      bootstrapCash,
      bootstrapPeopleFill,
      bootstrapCalendar3,
      bootstrapBuilding,
      bootstrapGeoAlt,
      bootstrapImages,
    }),
  ],
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

  readonly categoryLabel = computed(() => {
    const item = this.experience();
    return item ? getCategoryLabel(item.category) : '';
  });

  readonly priceLabel = computed(() => {
    const item = this.experience();
    return item ? formatCurrencyCop(item.priceCop) : '';
  });

  readonly scopeLabel = computed(() => (this.experience()?.scope === 'PROPERTY' ? 'Propiedad' : 'Global'));
  readonly propertyLabel = computed(() => this.experience()?.propertyName ?? 'Sin propiedad');
  readonly availabilitySummary = computed(() => {
    const item = this.experience();
    if (!item) {
      return '';
    }

    const { recurrence } = item;
    return `${formatDayList(recurrence.daysOfWeek)} - ${recurrence.startTime} a ${recurrence.endTime}`;
  });

  readonly coverImageOf = coverImageOf;
  readonly galleryUrls = computed(() => this.experience()?.mediaUrls?.slice(1) ?? []);

  constructor() {
    this.loadExperience();
  }

  onEdit(): void {
    const item = this.experience();
    if (!item?.id) {
      return;
    }

    this.router.navigate(['/tenant-experiences'], {
      queryParams: { modal: 'edit', id: item.id },
    });
  }

  private loadExperience(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('No se encontro el identificador de la experiencia.');
      this.isLoading.set(false);
      return;
    }

    this.getExperienceByIdUseCase
      .execute(id)
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
}
