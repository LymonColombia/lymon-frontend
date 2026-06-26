import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapBuilding, bootstrapCalendar3, bootstrapCash, bootstrapClock, bootstrapDashCircle, bootstrapFlag, bootstrapGeoAlt, bootstrapPencilSquare, bootstrapPeopleFill, bootstrapSignpost, bootstrapStars } from '@ng-icons/bootstrap-icons';
import { Experience } from '@/domain/entities/experience.model';
import {
  HotelPageActionsDirective,
  HotelPageLayoutComponent
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { GetExperienceByIdUseCase } from '@/domain/use-cases/experience/get-experience-by-id.use-case';
import { LocationMap } from "@/presentation/features/hotel/components/location-map/location-map";
import {formatDayList, formatCurrencyCop,getCategoryLabel,getScopeBadgeLabel,} from '../../models/experience-form.model';
import { coverImageOf } from '@/presentation/shared/utils/media.util';
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
  providers: [provideIcons({ bootstrapStars, bootstrapPencilSquare , bootstrapCash,bootstrapClock,bootstrapPeopleFill,bootstrapCalendar3,bootstrapDashCircle,bootstrapBuilding,bootstrapGeoAlt,bootstrapFlag,bootstrapSignpost})],
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

  readonly scopeBadge = computed(() => {
    const item = this.experience();
    return item ? getScopeBadgeLabel(item.scope) : '';
  });

  readonly categoryLabel = computed(() => {
    const item = this.experience();
    return item ? getCategoryLabel(item.category) : '';
  });

  readonly priceLabel = computed(() => {
    const item = this.experience();
    return item ? formatCurrencyCop(item.priceCop) : '';
  });

  // Cover is mediaUrls[0] (placeholder when empty); the rest is the gallery.
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
