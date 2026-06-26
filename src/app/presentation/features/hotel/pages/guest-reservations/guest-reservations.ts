import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Subject } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowDown,
  bootstrapArrowRight,
  bootstrapArrowUp,
  bootstrapCalendar,
  bootstrapCalendarCheck,
  bootstrapChevronDown,
  bootstrapChevronLeft,
  bootstrapChevronRight,
  bootstrapChevronUp,
  bootstrapExclamationTriangle,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { CalendarComponent, DateRange } from '@/presentation/shared/components/calendar/calendar.component';
import { GetGuestReservationsUseCase } from '@/domain/use-cases/reservation/get-guest-reservations.use-case';
import {
  GetGuestReservationsParams,
  GuestReservationResponse,
} from '@/domain/entities/guest-reservation.model';
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';
import { GuestNavComponent } from '../../components/guest-nav/guest-nav';
import { ReservationCardComponent } from './components/reservation-card/reservation-card';
import { RateReservationModalComponent } from './components/rate-reservation-modal/rate-reservation-modal.component';

type FilterKey = 'all' | 'active' | 'pending' | 'confirmed' | 'finished' | 'cancelled';

interface FilterTab {
  key: FilterKey;
  label: string;
}

const ITEMS_PER_PAGE = 6;
const FILTER_DATE_WRAPPER_SELECTOR = '.filter-date-wrapper';
const SHORT_MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const FILTER_TABS: FilterTab[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'active', label: 'En estadía' },
  { key: 'finished', label: 'Completadas' },
  { key: 'cancelled', label: 'Canceladas' },
];

const SORT_BY_OPTIONS: SelectOption[] = [
  { value: 'date', label: 'Fecha de entrada' },
  { value: 'status', label: 'Estado' },
  { value: 'createdAt', label: 'Fecha de creación' },
];

const SORT_ORDER_OPTIONS: SelectOption[] = [
  { value: 'desc', label: 'Descendente' },
  { value: 'asc', label: 'Ascendente' },
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
    RateReservationModalComponent,
    SelectComponent,
    CalendarComponent,
  ],
  providers: [
    provideIcons({
      bootstrapArrowDown,
      bootstrapArrowRight,
      bootstrapArrowUp,
      bootstrapCalendar,
      bootstrapCalendarCheck,
      bootstrapChevronDown,
      bootstrapChevronLeft,
      bootstrapChevronRight,
      bootstrapChevronUp,
      bootstrapExclamationTriangle,
    }),
  ],
  templateUrl: './guest-reservations.html',
  styleUrl: './guest-reservations.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestReservationsComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly getReservationsUseCase = inject(GetGuestReservationsUseCase);
  private readonly guestTokenService = inject(GuestTokenService);
  private readonly loadTrigger = new Subject<GetGuestReservationsParams>();

  readonly filterTabs = FILTER_TABS;
  readonly sortByOptions = SORT_BY_OPTIONS;
  readonly sortOrderOptions = SORT_ORDER_OPTIONS;
  readonly sortByLabels: Record<string, string> = {
    date: 'Fecha entrada',
    status: 'Estado',
    createdAt: 'Fecha creación',
  };

  readonly reservations = signal<GuestReservationResponse[]>([]);
  readonly ratingReservation = signal<GuestReservationResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly activeFilter = signal<FilterKey>('all');
  readonly activeSortBy = signal<'date' | 'status' | 'createdAt'>('date');
  readonly activeSortOrder = signal<'asc' | 'desc'>('desc');
  readonly fromDate = signal<string | undefined>(undefined);
  readonly toDate = signal<string | undefined>(undefined);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);
  readonly isFilterCalendarOpen = signal(false);

  readonly guestEmail = this.guestTokenService.getGuestEmail() ?? '';

  readonly fromDateDisplay = computed(() => this.formatDateDisplay(this.fromDate() ?? null));
  readonly toDateDisplay = computed(() => this.formatDateDisplay(this.toDate() ?? null));

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isFilterCalendarOpen()) return;
    const target = event.target as Element | null;
    if (!target) return;
    const wrapper = this.el.nativeElement.querySelector(FILTER_DATE_WRAPPER_SELECTOR) as Element | null;
    if (wrapper && !wrapper.contains(target)) {
      this.isFilterCalendarOpen.set(false);
    }
  }

  constructor() {
    this.loadTrigger.pipe(
      switchMap((params) =>
        this.getReservationsUseCase.execute(params).pipe(
          catchError(() => {
            this.errorMessage.set('No se pudieron cargar tus reservas. Intenta de nuevo.');
            this.isLoading.set(false);
            return EMPTY;
          }),
        ),
      ),
      takeUntilDestroyed(),
    ).subscribe(({ reservations, pagination }) => {
      this.reservations.set(reservations);
      this.totalItems.set(pagination.total);
      this.totalPages.set(pagination.totalPages);
      this.isLoading.set(false);
    });

    this.hydrateFromUrl();
    this.loadReservations();
  }

  readonly safeCurrentPage = computed(() => {
    const page = this.currentPage();
    const maxPage = this.totalPages();
    if (page < 1) return 1;
    if (page > maxPage) return maxPage;
    return page;
  });

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  loadReservations(page = 1): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.currentPage.set(page);
    this.syncQueryParams(page);
    this.loadTrigger.next(this.buildParams(page));
  }

  private hydrateFromUrl(): void {
    const p = this.route.snapshot.queryParamMap;
    const status = p.get('status');
    const fromDate = p.get('fromDate');
    const toDate = p.get('toDate');
    const sortBy = p.get('sortBy');
    const sortOrder = p.get('sortOrder');
    const page = p.get('page');

    if (status && this.isValidFilter(status)) this.activeFilter.set(status);
    if (fromDate) this.fromDate.set(fromDate);
    if (toDate) this.toDate.set(toDate);
    if (sortBy === 'date' || sortBy === 'status' || sortBy === 'createdAt') this.activeSortBy.set(sortBy);
    if (sortOrder === 'asc' || sortOrder === 'desc') this.activeSortOrder.set(sortOrder);
    if (page && Number(page) > 1) this.currentPage.set(Number(page));

    if (this.hasActiveFilters() || fromDate || toDate) this.showAdditionalFilters.set(true);
  }

  private isValidFilter(value: string): value is FilterKey {
    return FILTER_TABS.some((tab) => tab.key === value);
  }

  private syncQueryParams(page: number): void {
    const queryParams: Record<string, string> = {};
    const filter = this.activeFilter();
    const fromDate = this.fromDate();
    const toDate = this.toDate();
    const sortBy = this.activeSortBy();
    const sortOrder = this.activeSortOrder();

    if (filter !== 'all') queryParams['status'] = filter;
    if (fromDate) queryParams['fromDate'] = fromDate;
    if (toDate) queryParams['toDate'] = toDate;
    if (sortBy !== 'date') queryParams['sortBy'] = sortBy;
    if (sortOrder !== 'desc') queryParams['sortOrder'] = sortOrder;
    if (page > 1) queryParams['page'] = String(page);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'replace',
      replaceUrl: true,
    });
  }

  private buildParams(page: number): GetGuestReservationsParams {
    const params: GetGuestReservationsParams = {
      page,
      limit: ITEMS_PER_PAGE,
      sortBy: this.activeSortBy(),
      sortOrder: this.activeSortOrder(),
    };
    const filter = this.activeFilter();
    if (filter !== 'all') params.status = filter;
    const fromDate = this.fromDate();
    const toDate = this.toDate();
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    return params;
  }

  setFilter(key: FilterKey): void {
    this.activeFilter.set(key);
    this.loadReservations(1);
  }

  onSortByChange(value: string | number): void {
    if (value === 'date' || value === 'status' || value === 'createdAt') {
      this.activeSortBy.set(value);
      this.loadReservations(1);
    }
  }

  onSortOrderChange(value: string | number): void {
    if (value === 'asc' || value === 'desc') {
      this.activeSortOrder.set(value);
      this.loadReservations(1);
    }
  }

  toggleSortOrder(): void {
    this.activeSortOrder.update((o) => (o === 'desc' ? 'asc' : 'desc'));
    this.loadReservations(1);
  }

  toggleFilterCalendar(): void {
    this.isFilterCalendarOpen.update((v) => !v);
  }

  closeFilterCalendar(): void {
    this.isFilterCalendarOpen.set(false);
  }

  onFilterDateRangeChange(range: DateRange): void {
    this.fromDate.set(range.checkIn ?? undefined);
    this.toDate.set(range.checkOut ?? undefined);
    this.loadReservations(1);
  }

  clearFromDate(): void {
    this.fromDate.set(undefined);
    this.toDate.set(undefined);
    this.isFilterCalendarOpen.set(false);
    this.loadReservations(1);
  }

  clearToDate(): void {
    this.toDate.set(undefined);
    this.isFilterCalendarOpen.set(false);
    this.loadReservations(1);
  }

  clearAllFilters(): void {
    this.fromDate.set(undefined);
    this.toDate.set(undefined);
    this.activeFilter.set('all');
    this.activeSortBy.set('date');
    this.activeSortOrder.set('desc');
    this.isFilterCalendarOpen.set(false);
    this.loadReservations(1);
  }

  readonly hasActiveFilters = computed(() =>
    !!this.fromDate() || !!this.toDate() || this.activeFilter() !== 'all',
  );

  readonly showAdditionalFilters = signal(false);

  toggleAdditionalFilters(): void {
    this.showAdditionalFilters.update((v) => !v);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.loadReservations(page);
  }

  goToPreviousPage(): void {
    this.goToPage(this.safeCurrentPage() - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.safeCurrentPage() + 1);
  }

  onRateReservation(reservation: GuestReservationResponse): void {
    this.ratingReservation.set(reservation);
  }

  onRatingModalClose(): void {
    this.ratingReservation.set(null);
  }

  onRatingSubmitted(): void {
    this.ratingReservation.set(null);
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

  private formatDateDisplay(dateStr: string | null): string | null {
    if (!dateStr) return null;
    const parts = dateStr.split('-').map(Number);
    return `${parts[2]} ${SHORT_MONTH_NAMES[parts[1] - 1]} ${parts[0]}`;
  }
}
