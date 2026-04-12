import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowRight,
  bootstrapCalendar,
  bootstrapCalendarCheck,
  bootstrapChevronLeft,
  bootstrapChevronRight,
  bootstrapExclamationTriangle,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { GetGuestReservationsUseCase } from '@/domain/use-cases/reservation/get-guest-reservations.use-case';
import { GuestReservationResponse } from '@/domain/entities/guest-reservation.model';
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';
import { GuestNavComponent } from '../../components/guest-nav/guest-nav';
import { ReservationCardComponent } from './components/reservation-card/reservation-card';

type FilterKey = 'all' | 'pending' | 'confirmed' | 'checked_out' | 'cancelled';

interface FilterTab {
  key: FilterKey;
  label: string;
}

type SortKey = 'date-desc' | 'date-asc';

const ITEMS_PER_PAGE = 6;

const FILTER_TABS: FilterTab[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'checked_out', label: 'Completadas' },
  { key: 'cancelled', label: 'Canceladas' },
];

const SORT_OPTIONS: SelectOption[] = [
  { value: 'date-desc', label: 'Fecha: mas reciente' },
  { value: 'date-asc', label: 'Fecha: mas antigua' },
];

@Component({
  selector: 'app-guest-reservations',
  standalone: true,
  imports: [
    ButtonComponent,
    FooterComponent,
    NgIcon,
    GuestNavComponent,
    ReservationCardComponent,
    SelectComponent,
  ],
  providers: [
    provideIcons({
      bootstrapArrowRight,
      bootstrapCalendar,
      bootstrapCalendarCheck,
      bootstrapChevronLeft,
      bootstrapChevronRight,
      bootstrapExclamationTriangle,
    }),
  ],
  templateUrl: './guest-reservations.html',
  styleUrl: './guest-reservations.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestReservationsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly getReservationsUseCase = inject(GetGuestReservationsUseCase);
  private readonly guestTokenService = inject(GuestTokenService);

  readonly filterTabs = FILTER_TABS;
  readonly sortOptions = SORT_OPTIONS;

  readonly reservations = signal<GuestReservationResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly activeFilter = signal<FilterKey>('all');
  readonly activeSort = signal<SortKey>('date-desc');

  readonly guestEmail = this.guestTokenService.getGuestEmail() ?? '';

  readonly statusCounts = computed(() => {
    const all = this.reservations();
    return {
      all: all.length,
      pending: all.filter((r) => r.status === 'pending').length,
      confirmed: all.filter((r) => r.status === 'confirmed').length,
      checked_out: all.filter((r) => r.status === 'checked_out').length,
      cancelled: all.filter((r) => r.status === 'cancelled').length,
    };
  });

  readonly currentPage = signal(1);

  readonly filteredReservations = computed(() => {
    const filter = this.activeFilter();
    const all = this.reservations();
    if (filter === 'all') return all;
    return all.filter((r) => r.status === filter);
  });

  readonly sortedReservations = computed(() => {
    const sort = this.activeSort();
    const reservations = [...this.filteredReservations()];

    reservations.sort((a, b) => {
      const firstTime = new Date(a.checkIn).getTime();
      const secondTime = new Date(b.checkIn).getTime();
      return sort === 'date-asc' ? firstTime - secondTime : secondTime - firstTime;
    });

    return reservations;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedReservations().length / ITEMS_PER_PAGE)),
  );

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  readonly safeCurrentPage = computed(() => {
    const page = this.currentPage();
    const maxPage = this.totalPages();
    if (page < 1) return 1;
    if (page > maxPage) return maxPage;
    return page;
  });

  readonly pagedReservations = computed(() => {
    const page = this.safeCurrentPage();
    const start = (page - 1) * ITEMS_PER_PAGE;
    return this.sortedReservations().slice(start, start + ITEMS_PER_PAGE);
  });

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.currentPage.set(1);

    this.getReservationsUseCase.execute({ page: 1, limit: 200 }).subscribe({
      next: ({ reservations }) => {
        this.reservations.set(reservations);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar tus reservas. Intenta de nuevo.');
        this.isLoading.set(false);
      },
    });
  }

  setFilter(key: FilterKey): void {
    this.activeFilter.set(key);
    this.currentPage.set(1);
  }

  onSortChange(value: string | number): void {
    if (value !== 'date-asc' && value !== 'date-desc') {
      return;
    }

    this.activeSort.set(value);
    this.currentPage.set(1);
  }

  onPrevPage(): void {
    this.currentPage.set(Math.max(1, this.safeCurrentPage() - 1));
  }

  onNextPage(): void {
    this.currentPage.set(Math.min(this.totalPages(), this.safeCurrentPage() + 1));
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }

  goToPreviousPage(): void {
    this.goToPage(this.safeCurrentPage() - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.safeCurrentPage() + 1);
  }

  countFor(key: FilterKey): number {
    return this.statusCounts()[key];
  }

  onLogout(): void {
    this.guestTokenService.clear();
    void this.router.navigate(['/guest/login']);
  }

  goExplore(): void {
    void this.router.navigate(['/booking']);
  }

  goToCheckin(reservationId: string): void {
    void this.router.navigate(['/guest/checkin'], { queryParams: { reservationId } });
  }

  goToReservationDetails(reservationId: string): void {
    void this.router.navigate(['/guest/reservations', reservationId]);
  }
}
