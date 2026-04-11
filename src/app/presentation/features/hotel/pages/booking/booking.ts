import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { BookingRoomCard, RoomCardComponent } from './components/room-card/room-card.component';
import { BookingNavComponent } from './components/booking-nav/booking-nav.component';
import { BookingPaginationComponent } from './components/booking-pagination/booking-pagination.component';
import { BookingHeroComponent, BookingSearchParams } from './components/booking-hero/booking-hero.component';
import { BookingToolbarComponent, BookingSortOption } from './components/booking-toolbar/booking-toolbar.component';
import { BookingEmptyStateComponent } from './components/booking-empty-state/booking-empty-state.component';
import { GetPublicUnitsUseCase } from '@/domain/use-cases/property/get-public-units.use-case';
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';
import { Unit } from '@/domain/entities/staff.model';

const ITEMS_PER_PAGE = 6;

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
  ],
  templateUrl: './booking.html',
  styleUrl: './booking.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly getPublicUnitsUseCase = inject(GetPublicUnitsUseCase);
  readonly guestTokenService = inject(GuestTokenService);

  readonly isRoomsLoading = signal(false);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly checkIn = signal<string | undefined>(undefined);
  readonly checkOut = signal<string | undefined>(undefined);
  readonly selectedGuests = signal<number | undefined>(undefined);

  readonly searchQuery = signal('');
  readonly sortBy = signal<BookingSortOption>('rating');
  readonly likedRoomIds = signal(new Set<string>());

  readonly rooms = signal<BookingRoomCard[]>([]);

  readonly displayedRooms = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sort = this.sortBy();
    const guests = this.selectedGuests();

    let result = this.rooms();

    if (guests) result = result.filter((r) => (r.maxGuests ?? Infinity) >= guests);
    if (query) result = result.filter((r) => r.title.toLowerCase().includes(query));

    if (sort === 'price-asc') return [...result].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') return [...result].sort((a, b) => b.price - a.price);
    return result;
  });

  ngOnInit(): void {
    this.loadUnits(1);
  }

  loadUnits(page: number): void {
    this.isRoomsLoading.set(true);
    this.getPublicUnitsUseCase
      .execute({
        page,
        limit: ITEMS_PER_PAGE,
        checkIn: this.checkIn(),
        checkOut: this.checkOut(),
        guests: this.selectedGuests(),
      })
      .subscribe({
        next: ({ units, pagination }) => {
          this.rooms.set(units.map((unit) => this.toRoomCard(unit)));
          this.currentPage.set(pagination.page);
          this.totalPages.set(pagination.totalPages);
          this.isRoomsLoading.set(false);
        },
        error: () => {
          this.rooms.set([]);
          this.isRoomsLoading.set(false);
        },
      });
  }

  onHeroSearch(params: BookingSearchParams): void {
    this.checkIn.set(params.checkIn);
    this.checkOut.set(params.checkOut);
    this.selectedGuests.set(params.guests);
    this.loadUnits(1);
  }

  onPageChange(page: number): void {
    this.loadUnits(page);
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
  }

  onSortChange(sort: BookingSortOption): void {
    this.sortBy.set(sort);
  }

  onToggleLike(roomId: string): void {
    this.likedRoomIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  }

  isLiked(roomId: string): boolean {
    return this.likedRoomIds().has(roomId);
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

  private toRoomCard(unit: Unit): BookingRoomCard {
    return {
      id: unit.id,
      title: unit.name,
      price: unit.pricePerNight ?? 0,
      description: unit.description ?? 'Sin descripción disponible para esta habitación.',
      features: [
        { icon: 'bootstrapHouseDoorFill', label: this.getBedsSummary(unit) },
        {
          icon: 'bootstrapDoorOpenFill',
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
