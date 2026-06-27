import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { BookingRoomCard, RoomCardComponent } from './components/room-card/room-card.component';
import { BookingNavComponent } from './components/booking-nav/booking-nav.component';
import { BookingPaginationComponent } from './components/booking-pagination/booking-pagination.component';
import { BookingHeroComponent, BookingSearchParams } from './components/booking-hero/booking-hero.component';
import { BookingToolbarComponent, BookingSortOption } from './components/booking-toolbar/booking-toolbar.component';
import { BookingEmptyStateComponent } from './components/booking-empty-state/booking-empty-state.component';
import { BookingSkeletonCardComponent } from './components/booking-skeleton-card/booking-skeleton-card.component';
import { GetPublicUnitsUseCase } from '@/domain/use-cases/property/get-public-units.use-case';
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';
import { Unit } from '@/domain/entities/staff.model';

const ITEMS_PER_PAGE = 8;

@Component({
  selector: 'booking-page',
  standalone: true,
  imports: [
    FooterComponent,
    RoomCardComponent,
    BookingNavComponent,
    BookingPaginationComponent,
    BookingHeroComponent,
    BookingToolbarComponent,
    BookingEmptyStateComponent,
    BookingSkeletonCardComponent,
  ],
  templateUrl: './booking.html',
  styleUrl: './booking.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly getPublicUnitsUseCase = inject(GetPublicUnitsUseCase);
  readonly guestTokenService = inject(GuestTokenService);

  readonly skeletonItems = Array.from({ length: ITEMS_PER_PAGE }, (_, i) => i);

  readonly isRoomsLoading = signal(false);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);
  readonly startDate = signal<string | undefined>(undefined);
  readonly endDate = signal<string | undefined>(undefined);
  readonly minGuests = signal<number | undefined>(undefined);

  readonly searchQuery = signal('');
  readonly sortBy = signal<BookingSortOption>('rating');

  readonly rooms = signal<BookingRoomCard[]>([]);

  private readonly resultsSection = viewChild<ElementRef<HTMLElement>>('resultsSection');
  private readonly bookingNav = viewChild('bookingNav', { read: ElementRef });

  readonly displayedRooms = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sort = this.sortBy();

    let result = this.rooms();

    if (query) result = result.filter((r) => r.title.toLowerCase().includes(query));

    if (sort === 'price-asc') return [...result].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') return [...result].sort((a, b) => b.price - a.price);
    return result;
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const startDate = params.get('startDate') ?? undefined;
    const endDate = params.get('endDate') ?? undefined;
    const minGuests = params.get('minGuests');
    this.startDate.set(startDate);
    this.endDate.set(endDate);
    const parsed = minGuests === null ? Number.NaN : Number(minGuests);
    this.minGuests.set(Number.isNaN(parsed) ? undefined : parsed);
    this.loadUnits(1);
  }

  loadUnits(page: number, scrollOnComplete = false): void {
    this.isRoomsLoading.set(true);
    this.getPublicUnitsUseCase
      .execute({
        page,
        limit: ITEMS_PER_PAGE,
        startDate: this.startDate(),
        endDate: this.endDate(),
        minGuests: this.minGuests(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ units, pagination }) => {
          this.rooms.set(units.map((unit) => this.toRoomCard(unit)));
          this.currentPage.set(pagination.page);
          this.totalPages.set(pagination.totalPages);
          this.totalCount.set(pagination.total);
          this.isRoomsLoading.set(false);
          if (scrollOnComplete) this.scrollToResults();
        },
        error: () => {
          this.rooms.set([]);
          this.isRoomsLoading.set(false);
        },
      });
  }

  onHeroSearch(params: BookingSearchParams): void {
    this.startDate.set(params.startDate);
    this.endDate.set(params.endDate);
    this.minGuests.set(params.minGuests);
    this.syncQueryParams();
    this.loadUnits(1);
  }

  onPageChange(page: number): void {
    this.loadUnits(page, true);
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
  }

  onSortChange(sort: BookingSortOption): void {
    this.sortBy.set(sort);
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

  private scrollToResults(): void {
    const section = this.resultsSection()?.nativeElement;
    const nav = this.bookingNav()?.nativeElement;
    if (!section) return;
    const navHeight = nav?.offsetHeight ?? 0;
    const top = section.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  private syncQueryParams(): void {
    const queryParams: Record<string, string> = {};
    const startDate = this.startDate();
    const endDate = this.endDate();
    const minGuests = this.minGuests();
    if (startDate) queryParams['startDate'] = startDate;
    if (endDate) queryParams['endDate'] = endDate;
    if (minGuests !== undefined) queryParams['minGuests'] = String(minGuests);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'replace',
      replaceUrl: true,
    });
  }

  private toRoomCard(unit: Unit): BookingRoomCard {
    return {
      id: unit.id,
      title: unit.name,
      price: unit.pricePerNight ?? 0,
      description: unit.description ?? 'Sin descripción disponible para esta habitación.',
      features: [
        { icon: 'single-bed', label: this.getBedsSummary(unit) },
        {
          icon: 'bath',
          label: `${unit.bathroomsCount ?? 0} baño${(unit.bathroomsCount ?? 0) === 1 ? '' : 's'}`,
        },
        {
          icon: 'bootstrapPeopleFill',
          label: `${unit.maxGuests ?? unit.standardGuests ?? 1} Persona${(unit.maxGuests ?? unit.standardGuests ?? 1) === 1 ? '' : 's'}`,
        },
      ],
      amenities: unit.amenities ?? [],
      badgeLabel: unit.isShared ? 'Compartida' : 'Disponible',
      badgeVariant: unit.isShared ? 'shared' : 'available',
      featured: (unit.pricePerNight ?? 0) >= 200,
      maxGuests: unit.maxGuests ?? unit.standardGuests,
      rating: unit.rating ?? undefined,
      images: unit.mediaUrls ?? [],
    };
  }

  private getBedsSummary(unit: Unit): string {
    const beds = unit.bedrooms?.flatMap((bedroom) => bedroom.beds ?? []) ?? [];

    if (beds.length === 0) {
      return 'Sin información de camas';
    }

    const totalBeds = beds.reduce((sum, bed) => sum + (bed.count ?? 0), 0);
    return `${totalBeds} cama${totalBeds === 1 ? '' : 's'}`;
  }
}
