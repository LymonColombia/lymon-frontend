import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { CrmGuest, CrmGuestBooking, CrmGuestSortBy, CrmGuestSortDirection } from '@/domain/entities/crm-guest.model';
import { GetCrmGuestBookingsUseCase } from '@/domain/use-cases/crm/get-crm-guest-bookings.use-case';
import { GetCrmGuestsUseCase } from '@/domain/use-cases/crm/get-crm-guests.use-case';
import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import {
  SelectComponent,
  SelectOption,
} from '@/presentation/shared/components/select/select.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import {
  bootstrapPeopleFill,
  bootstrapPerson,
  bootstrapEnvelope,
  bootstrapTelephone,
  bootstrapChevronLeft,
  bootstrapChevronRight,
  bootstrapArrowUp,
  bootstrapArrowDown,
} from '@ng-icons/bootstrap-icons';

type SearchField = 'name' | 'email' | 'phone';
type FilterIcon = 'user' | 'mail' | 'phone';

interface FilterOption {
  key: SearchField;
  label: string;
  icon: FilterIcon;
}

@Component({
  selector: 'app-guests-crm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HotelPageLayoutComponent, ButtonComponent, InputComponent, SelectComponent, NgIcon],
  providers: [
    provideIcons({
      bootstrapPeopleFill,
      bootstrapPerson,
      bootstrapEnvelope,
      bootstrapTelephone,
      bootstrapChevronLeft,
      bootstrapChevronRight,
      bootstrapArrowUp,
      bootstrapArrowDown,
    }),
  ],
  templateUrl: './guestsCrm.html',
  styleUrl: './guestsCrm.css',
})
export class GuestsCrmComponent implements OnInit {
  private readonly getCrmGuestsUseCase = inject(GetCrmGuestsUseCase);
  private readonly getCrmGuestBookingsUseCase = inject(GetCrmGuestBookingsUseCase);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly latestReservationDatesByGuestId = signal<Record<string, string | null>>({});
  readonly searchField = signal<SearchField>('name');
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = 5;
  readonly sortBy = signal<CrmGuestSortBy>('createdAt');
  readonly sortDirection = signal<CrmGuestSortDirection>('desc');

  readonly sortColumns: CrmGuestSortBy[] = ['createdAt', 'fullName', 'status'];
  readonly sortLabels: Record<CrmGuestSortBy, string> = {
    createdAt: 'Fecha registro',
    fullName: 'Nombre',
    status: 'Estado',
  };

  readonly filterOptions: FilterOption[] = [
    { key: 'name', label: 'Nombre', icon: 'user' },
    { key: 'email', label: 'Correo electrónico', icon: 'mail' },
    { key: 'phone', label: 'Teléfono', icon: 'phone' },
  ];
  readonly selectOptions: SelectOption[] = this.filterOptions.map((option) => ({
    value: option.key,
    label: option.label,
  }));

  readonly guests = signal<CrmGuest[]>([]);

  ngOnInit(): void {
    this.loadGuests();
  }

  readonly filteredGuests = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const field = this.searchField();
    if (!term) {
      return this.guests();
    }

    return this.guests().filter((guest) => guest[field].toLowerCase().includes(term));
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredGuests().length / this.pageSize)),
  );

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  readonly selectedFilterOption = computed(
    () =>
      this.filterOptions.find((option) => option.key === this.searchField()) ??
      this.filterOptions[0],
  );

  readonly searchPlaceholder = computed(() => {
    const option = this.selectedFilterOption();
    return `Buscar por ${option.label.toLowerCase()}...`;
  });

  readonly paginatedGuests = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this.filteredGuests().slice(start, start + this.pageSize);
  });

  selectSearchField(field: SearchField | string | number | null): void {
    if (field !== 'name' && field !== 'email' && field !== 'phone') {
      return;
    }

    this.searchField.set(field);
    this.currentPage.set(1);
  }

  onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  formatPhone(phone: string): string {
    if (!phone.startsWith('+') || phone.includes(' ')) {
      return phone;
    }

    const digits = phone.slice(1);
    if (digits.length <= 10) {
      return phone;
    }

    const countryCode = digits.slice(0, digits.length - 10);
    const localNumber = digits.slice(-10);
    return `+${countryCode} ${localNumber}`;
  }

  getLatestReservationLabel(guest: CrmGuest): string {
    const guestId = this.getGuestRouteId(guest);
    if (!guestId) {
      return 'N/A';
    }

    const latestReservationDate = this.latestReservationDatesByGuestId()[guestId];
    return latestReservationDate ? this.formatDateLabel(latestReservationDate) : 'N/A';
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.currentPage.set(page);
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  setSort(column: CrmGuestSortBy): void {
    if (this.sortBy() === column) return;
    this.sortBy.set(column);
    this.sortDirection.set('desc');
    this.currentPage.set(1);
    this.loadGuests();
  }

  toggleSortDirection(): void {
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    this.currentPage.set(1);
    this.loadGuests();
  }

  navigateToFullProfile(guest: CrmGuest): void {
    const guestId = this.getGuestRouteId(guest);
    if (!guestId) return;
    void this.router.navigate(['/crm/guests', guestId]);
  }

  private getGuestRouteId(guest: CrmGuest | null): string | null {
    return guest?.id?.trim() || null;
  }

  private formatDateLabel(value: string, withTime = false): string {
    if (!value) {
      return 'Sin fecha';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    })
      .format(date)
      .replace('.', '');
  }

  private loadGuests(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.getCrmGuestsUseCase.execute({ sortBy: this.sortBy(), sortDirection: this.sortDirection() }).subscribe({
      next: (guests) => {
        this.guests.set(guests);
        this.loadLatestReservationDates(guests);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (error.status === 401) {
          this.errorMessage.set('Tu sesión expiró. Inicia sesión nuevamente.');
        } else if (error.status === 403) {
          this.errorMessage.set('No tienes permisos para ver los huéspedes.');
        } else {
          this.errorMessage.set('No se pudo cargar la lista de huéspedes. Inténtalo de nuevo.');
        }
      },
    });
  }

  private loadLatestReservationDates(guests: CrmGuest[]): void {
    const guestsWithIds = guests.filter((guest) => this.getGuestRouteId(guest));
    if (guestsWithIds.length === 0) {
      this.latestReservationDatesByGuestId.set({});
      return;
    }

    forkJoin(
      guestsWithIds.map((guest) => {
        const guestId = this.getGuestRouteId(guest)!;
        return this.getCrmGuestBookingsUseCase.execute(guestId).pipe(
          map((bookings) => ({
            guestId,
            latestReservationDate: this.getLatestReservationDate(bookings),
          })),
          catchError(() =>
            of({
              guestId,
              latestReservationDate: null,
            }),
          ),
        );
      }),
    ).subscribe((results) => {
      const latestDates = results.reduce<Record<string, string | null>>((guestDateMap, result) => {
        guestDateMap[result.guestId] = result.latestReservationDate;
        return guestDateMap;
      }, {});

      this.latestReservationDatesByGuestId.set(latestDates);
    });
  }

  private getLatestReservationDate(bookings: CrmGuestBooking[]): string | null {
    const bookingDates = bookings
      .map((booking) => booking.createdAt)
      .filter((date) => {
        return Boolean(date) && !Number.isNaN(new Date(date).getTime());
      });

    if (bookingDates.length === 0) {
      return null;
    }

    return bookingDates.reduce((latest, current) =>
      new Date(current).getTime() > new Date(latest).getTime() ? current : latest,
    );
  }
}
