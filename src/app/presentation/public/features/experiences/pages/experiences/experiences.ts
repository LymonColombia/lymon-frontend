import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CatalogNavComponent } from '@/presentation/public/components/catalog-nav/catalog-nav';
import { CatalogPaginationComponent } from '@/presentation/public/components/catalog-pagination/catalog-pagination';
import { CatalogSkeletonCardComponent } from '@/presentation/public/components/catalog-skeleton-card/catalog-skeleton-card';
import { FooterComponent } from '@/presentation/shared/components/footer/footer';
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';
import { GetGuestExperiencesUseCase } from '@/domain/use-cases/experience/get-guest-experiences.use-case';
import { GuestExperience } from '@/domain/entities/guest-experience.model';
import { ExperienceHeroComponent, ExperienceHeroFilters } from './components/experience-hero/experience-hero';
import {
  ExperienceToolbarComponent,
  ExperienceCategoryFilter,
  ExperienceSortOption,
} from './components/experience-toolbar/experience-toolbar';
import { ExperienceCardComponent } from './components/experience-card/experience-card';
import { ExperienceEmptyStateComponent } from './components/experience-empty-state/experience-empty-state';

const ITEMS_PER_PAGE = 8;

@Component({
  selector: 'app-experiences',
  standalone: true,
  imports: [
    ExperienceHeroComponent,
    ExperienceToolbarComponent,
    ExperienceCardComponent,
    ExperienceEmptyStateComponent,
    FooterComponent,
    CatalogNavComponent,
    CatalogPaginationComponent,
    CatalogSkeletonCardComponent,
  ],
  templateUrl: './experiences.html',
  styleUrl: './experiences.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly guestTokenService = inject(GuestTokenService);
  private readonly getGuestExperiencesUseCase = inject(GetGuestExperiencesUseCase);
  private experiencesLoadSubscription?: Subscription;

  readonly isExperienceLoading = signal(false);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly skeletonItems = Array.from({ length: ITEMS_PER_PAGE }, (_, i) => i);
  readonly searchQuery = signal('');
  readonly sortBy = signal<ExperienceSortOption>(undefined);
  readonly sortByPrice = computed<'asc' | 'desc' | undefined>(() => {
    const sort = this.sortBy();
    if (sort === 'asc' || sort === 'desc') {
      return sort;
    }
    return undefined;
  });

  readonly selectedCategory = signal<ExperienceCategoryFilter>(null);
  readonly tenantId = signal('');
  readonly propertyId = signal('');

  readonly likedExperiencesIds = signal(new Set<string>());
  readonly experiences = signal<GuestExperience[]>([]);

  readonly guestEmail = this.guestTokenService.getGuestEmail();

  readonly backendFilters = computed(() => ({
    category: this.selectedCategory(),
    tenantId: this.tenantId().trim(),
    propertyId: this.propertyId().trim(),
    sortByPrice: this.sortByPrice(),
  }));

  readonly filteredExperiences = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();

    let result = this.experiences();

    if (query) {
      result = result.filter(
        (experience) =>
          experience.name.toLowerCase().includes(query) ||
          experience.description.toLowerCase().includes(query) ||
          experience.location.label.toLowerCase().includes(query) ||
          experience.location.address.toLowerCase().includes(query),
      );
    }

    if (category) {
      result = result.filter((experience) => experience.category === category);
    }
    return [...result];
  });

  constructor() {
    this.loadExperiences(1);
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
  }

  onSortChange(sort: ExperienceSortOption): void {
    this.sortBy.set(sort);
    this.loadExperiences(1);
  }

  onCategoryChange(category: ExperienceCategoryFilter): void {
    this.selectedCategory.set(category);
    this.loadExperiences(1);
  }


  onHeroFiltersApply(filters: ExperienceHeroFilters): void {
    this.selectedCategory.set(filters.category ?? null);
    this.loadExperiences(1);
  }

  onTenantIdChange(tenantId: string): void {
    this.tenantId.set(tenantId);
    this.loadExperiences(1);
  }

  onPropertyIdChange(propertyId: string): void {
    this.propertyId.set(propertyId);
    this.loadExperiences(1);
  }

  onToggleLike(experienceId: string): void {
    this.likedExperiencesIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(experienceId)) {
        next.delete(experienceId);
      } else {
        next.add(experienceId);
      }
      return next;
    });
  }

  onPageChange(page: number): void {
    this.loadExperiences(page, true);
  }

  private loadExperiences(page: number, scrollOnComplete = false): void {
    this.experiencesLoadSubscription?.unsubscribe();
    this.isExperienceLoading.set(true);

    const filters = this.backendFilters();
    this.experiencesLoadSubscription = this.getGuestExperiencesUseCase
      .execute({
        category: filters.category || undefined,
        tenantId: filters.tenantId || undefined,
        propertyId: filters.propertyId || undefined,
        sortByPrice: filters.sortByPrice,
        page,
        limit: ITEMS_PER_PAGE,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.experiences.set(response.experiences);
          this.currentPage.set(response.page);
          this.totalPages.set(response.totalPages);
          this.isExperienceLoading.set(false);
        },
        error: () => {
          this.experiences.set([]);
          this.currentPage.set(1);
          this.totalPages.set(1);
          this.isExperienceLoading.set(false);
        },
      });
  }

  goToExperienceDetails(experienceId: string): void {
    this.router.navigate(['/experiences', experienceId]);
  }

  onGuestLogin(): void {
    this.router.navigate(['/guest/login']);
  }

  onMyReservations(): void {
    this.router.navigate(['/guest/reservations']);
  }

  onGuestLogout(): void {
    this.guestTokenService.clear();
  }

  goToRoomDetails(unitId: string): void {
    this.router.navigate(['/room-details', unitId]);
  }
}
