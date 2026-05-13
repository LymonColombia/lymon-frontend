import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapPencilSquare, bootstrapStars } from '@ng-icons/bootstrap-icons';

import { Experience } from '@/domain/entities/experience.model';
import {
  HotelPageActionsDirective,
  HotelPageLayoutComponent,
  HotelPageMetaDirective,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { ExperienceAvailabilitySectionComponent } from '../../components/experience-availability-section/experience-availability-section.component';
import { ExperienceLocationSectionComponent } from '../../components/experience-location-section/experience-location-section.component';
import { TenantExperienceLocalStoreService } from '../../tenant-experience-local-store.service';

@Component({
  selector: 'app-tenant-experience-detail-page',
  standalone: true,
  imports: [
    HotelPageLayoutComponent,
    HotelPageMetaDirective,
    HotelPageActionsDirective,
    ButtonComponent,
    ExperienceAvailabilitySectionComponent,
    ExperienceLocationSectionComponent,
    NgIcon,
  ],
  providers: [provideIcons({ bootstrapStars, bootstrapPencilSquare })],
  templateUrl: './tenant-experience-detail-page.component.html',
  styleUrl: './tenant-experience-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantExperienceDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly localStore = inject(TenantExperienceLocalStoreService);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly experience = signal<Experience | null>(null);

  readonly scopeBadge = computed(() => {
    const item = this.experience();
    return item ? this.getScopeBadgeLabel(item.scope) : '';
  });

  readonly categoryLabel = computed(() => {
    const item = this.experience();
    return item ? this.getCategoryLabel(item.category) : '';
  });

  readonly priceLabel = computed(() => {
    const item = this.experience();
    return item ? this.formatCurrencyCop(item.priceCop) : '';
  });

  readonly availabilityLabel = computed(() => {
    const item = this.experience();
    return item ? this.getAvailabilityLabel(item.availabilityType) : '';
  });

  constructor() {
    this.loadExperience();
  }

  onEdit(): void {
    const item = this.experience();
    if (!item) {
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

    this.localStore.getById(id).subscribe({
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

  private formatCurrencyCop(priceCop: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(priceCop);
  }

  private getScopeBadgeLabel(scope: Experience['scope']): string {
    return scope === 'PROPERTY' ? 'Propiedad' : 'Tenant';
  }

  private getCategoryLabel(category: string): string {
    const normalized = category.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private getAvailabilityLabel(type: Experience['availabilityType']): string {
    return type === 'DATE_RANGE' ? 'Rango de Fechas' : 'Recurrencia';
  }
}
