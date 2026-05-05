import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ExperienceHeroComponent ,ExperienceHeroFilters} from './components/experience-hero/experience-hero';
import {
  ExperienceToolbarComponent,
  ExperienceCategoryFilter,
  ExperienceOwnerTypeFilter,
  ExperienceSortOption,
} from './components/experience-toolbar/experience-toolbar.component';
import { ExperienceCardComponent } from './components/experience-card/experience-card.component';
import { ExperienceEmptyStateComponent } from './components/experience-empty-state/experience-empty-state.component';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { EXPERIENCE_CATALOG } from './experiences.data';
import { ExperienceDetail } from '@/domain/entities/experience.model';
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';
import { BookingNavComponent } from "../booking/components/booking-nav/booking-nav.component";

@Component({
  selector: 'app-experiences',
  standalone: true,
  imports: [
    ExperienceHeroComponent,
    ExperienceToolbarComponent,
    ExperienceCardComponent,
    ExperienceEmptyStateComponent,
    FooterComponent,
    BookingNavComponent
],
  templateUrl: './experiences.html',
  styleUrl: './experiences.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ExperienceComponent implements OnInit {
  private readonly router = inject(Router);
   readonly guestTokenService = inject(GuestTokenService);

  readonly isExperienceLoading = signal(false);

  readonly searchQuery = signal('');
  readonly sortBy = signal<ExperienceSortOption>('rating');
  readonly selectedCategory = signal<ExperienceCategoryFilter>('all');
  readonly selectedOwnerType = signal<ExperienceOwnerTypeFilter>('all');
  readonly likedExperiencesIds = signal(new Set<string>());
  
  readonly experiences = signal<ExperienceDetail[]>([]);

  readonly filteredExperiences = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    const ownerType = this.selectedOwnerType();
    const sort = this.sortBy();

    let result = this.experiences();

    if (query) {
      result = result.filter(
        (experience) =>
          experience.title.toLowerCase().includes(query) ||
          experience.location.toLowerCase().includes(query) ||
          experience.ownerName.toLowerCase().includes(query),
      );
    }

    if (category !== 'all') {
      result = result.filter((experience) => experience.category === category);
    }

    if (ownerType !== 'all') {
      result = result.filter((experience) => experience.ownerType === ownerType);
    }

    if (sort === 'price-asc') {
      return [...result].sort((a, b) => a.priceFrom - b.priceFrom);
    }

    if (sort === 'price-desc') {
      return [...result].sort((a, b) => b.priceFrom - a.priceFrom);
    }

    return [...result].sort((a, b) => b.rating - a.rating);
  });
 

  ngOnInit(): void {
    this.loadExperiences();
  }

  private loadExperiences(): void {
    this.isExperienceLoading.set(true);
    setTimeout(() => {
      this.experiences.set(EXPERIENCE_CATALOG);
      this.isExperienceLoading.set(false);
    }, 1000);
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
  }

  onSortChange(sort: ExperienceSortOption): void {
    this.sortBy.set(sort);
  }

  onCategoryChange(category: ExperienceCategoryFilter): void {
    this.selectedCategory.set(category);
  }

  onOwnerTypeChange(ownerType: ExperienceOwnerTypeFilter): void {
    this.selectedOwnerType.set(ownerType);
  }

  onHeroFiltersApply(filters: ExperienceHeroFilters): void {
    this.selectedCategory.set(filters.category);
    this.selectedOwnerType.set(filters.ownerType);
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

  goToExperienceDetails(experienceId: string): void {
    void this.router.navigate(['/experiences', experienceId]);
  }


  readonly guestEmail = this.guestTokenService.getGuestEmail();
  
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
