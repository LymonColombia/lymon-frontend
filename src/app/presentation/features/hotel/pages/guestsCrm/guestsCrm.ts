import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateCrmGuestNoteRequest,
  CrmGuest,
  CrmGuestBooking,
  CrmGuestNoteCategory,
} from '@/domain/entities/crm-guest.model';
import { CreateCrmGuestNoteUseCase } from '@/domain/use-cases/crm/create-crm-guest-note.use-case';
import { GetCrmGuestBookingsUseCase } from '@/domain/use-cases/crm/get-crm-guest-bookings.use-case';
import { GetCrmGuestsUseCase } from '@/domain/use-cases/crm/get-crm-guests.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { Property, Unit } from '@/domain/entities/staff.model';
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
  bootstrapPlus,
  bootstrapPerson,
  bootstrapPersonCheck,
  bootstrapEnvelope,
  bootstrapTelephone,
  bootstrapTags,
  bootstrapHouseDoor,
  bootstrapCalendarCheck,
  bootstrapWallet2,
  bootstrapChevronLeft,
  bootstrapChevronRight,
  bootstrapXLg,
  bootstrapCardText,
} from '@ng-icons/bootstrap-icons';

type SearchField = 'name' | 'email' | 'phone';
type FilterIcon = 'user' | 'mail' | 'phone';

interface FilterOption {
  key: SearchField;
  label: string;
  icon: FilterIcon;
}

type GuestPreviewStatTone = 'neutral' | 'success';
type BookingStatusTone = 'info' | 'muted' | 'success' | 'warning' | 'danger';

interface GuestPreviewStat {
  label: string;
  value: string;
  icon: 'calendar' | 'wallet' | 'status';
  tone?: GuestPreviewStatTone;
}

interface GuestBookingPreview {
  id: string;
  propertyLabel: string;
  unitLabel: string;
  dateRange: string;
  amount: string;
  statusLabel: string;
  statusTone: BookingStatusTone;
  bookingDateLabel: string;
}

interface GuestPanelPreview {
  subtitle: string;
  stats: GuestPreviewStat[];
}

interface GuestNoteCategoryOption {
  value: CrmGuestNoteCategory;
  label: string;
}

type PropertyLookupItem = Property & {
  _id?: string;
  propertyId?: string;
  title?: string;
};

type UnitLookupItem = Unit & {
  _id?: string;
  unitId?: string;
  title?: string;
  unitName?: string;
};

const GUEST_NOTE_MAX_LENGTH = 280;

@Component({
  selector: 'app-guests-crm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeGuestPanel()',
  },
  imports: [HotelPageLayoutComponent, ButtonComponent, InputComponent, SelectComponent, NgIcon],
  providers: [
    provideIcons({
      bootstrapPeopleFill,
      bootstrapPlus,
      bootstrapPerson,
      bootstrapPersonCheck,
      bootstrapEnvelope,
      bootstrapTelephone,
      bootstrapTags,
      bootstrapHouseDoor,
      bootstrapCalendarCheck,
      bootstrapWallet2,
      bootstrapChevronLeft,
      bootstrapChevronRight,
      bootstrapXLg,
      bootstrapCardText,
    }),
  ],
  templateUrl: './guestsCrm.html',
  styleUrl: './guestsCrm.css',
})
export class GuestsCrmComponent implements OnInit {
  private readonly getCrmGuestsUseCase = inject(GetCrmGuestsUseCase);
  private readonly createCrmGuestNoteUseCase = inject(CreateCrmGuestNoteUseCase);
  private readonly getCrmGuestBookingsUseCase = inject(GetCrmGuestBookingsUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly getUnitsUseCase = inject(GetUnitsUseCase);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isBookingsLoading = signal(false);
  readonly bookingsErrorMessage = signal<string | null>(null);
  readonly isGuestNoteFormVisible = signal(false);
  readonly isSavingGuestNote = signal(false);
  readonly guestNoteErrorMessage = signal<string | null>(null);
  readonly guestNoteCategory = signal<CrmGuestNoteCategory>('general');
  readonly guestNoteContent = signal('');
  readonly loadedBookingsGuestId = signal<string | null>(null);
  readonly latestReservationDatesByGuestId = signal<Record<string, string | null>>({});
  readonly propertyNamesById = signal<Record<string, string>>({});
  readonly unitNamesById = signal<Record<string, string>>({});
  readonly loadedUnitPropertyIds = signal<string[]>([]);
  readonly searchField = signal<SearchField>('name');
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly routeGuestId = signal<string | null>(null);
  readonly pageSize = 5;
  readonly filterOptions: FilterOption[] = [
    { key: 'name', label: 'Nombre', icon: 'user' },
    { key: 'email', label: 'Correo electrónico', icon: 'mail' },
    { key: 'phone', label: 'Teléfono', icon: 'phone' },
  ];
  readonly selectOptions: SelectOption[] = this.filterOptions.map((option) => ({
    value: option.key,
    label: option.label,
  }));
  readonly guestNoteCategoryOptions: GuestNoteCategoryOption[] = [
    { value: 'general', label: 'General' },
    { value: 'preference', label: 'Preferencia' },
    { value: 'behavior', label: 'Comportamiento' },
    { value: 'incident', label: 'Incidente' },
  ];
  readonly guestNoteSelectOptions: SelectOption[] = this.guestNoteCategoryOptions.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  readonly guests = signal<CrmGuest[]>([]);
  readonly guestBookings = signal<CrmGuestBooking[]>([]);
  readonly selectedGuest = signal<CrmGuest | null>(null);
  readonly isGuestPanelOpen = computed(() => this.selectedGuest() !== null);
  readonly selectedGuestPreview = computed<GuestPanelPreview | null>(() => {
    const guest = this.selectedGuest();
    if (!guest) {
      return null;
    }

    return this.buildGuestPanelPreview(guest);
  });
  readonly selectedGuestBookingPreview = computed<GuestBookingPreview[]>(() =>
    this.guestBookings().map((booking) => this.toGuestBookingPreview(booking)),
  );
  readonly selectedGuestTags = computed(() => {
    const guest = this.selectedGuest();
    return guest?.tags?.filter((tag) => tag.trim().length > 0) ?? [];
  });
  readonly guestNoteCharacterCount = computed(() => this.guestNoteContent().length);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.routeGuestId.set(params.get('guestId'));
      this.syncSelectedGuestFromRoute();
    });

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

  setGuestNoteCategory(value: string | number | null): void {
    if (
      value !== 'general' &&
      value !== 'preference' &&
      value !== 'behavior' &&
      value !== 'incident'
    ) {
      return;
    }

    this.guestNoteCategory.set(value);
  }

  onGuestNoteContentChange(value: string): void {
    this.guestNoteContent.set(value.slice(0, GUEST_NOTE_MAX_LENGTH));
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

  openGuestNoteForm(): void {
    this.isGuestNoteFormVisible.set(true);
    this.guestNoteErrorMessage.set(null);
  }

  cancelGuestNoteForm(): void {
    this.resetGuestNoteForm();
  }

  openGuestPanel(guest: CrmGuest): void {
    this.selectedGuest.set(guest);
    if (this.loadedBookingsGuestId() !== this.getGuestRouteId(guest)) {
      this.loadGuestBookings(guest);
    }
    this.updateGuestQueryParam(this.getGuestRouteId(guest));
  }

  closeGuestPanel(): void {
    if (!this.isGuestPanelOpen()) {
      return;
    }

    this.selectedGuest.set(null);
    this.guestBookings.set([]);
    this.bookingsErrorMessage.set(null);
    this.isBookingsLoading.set(false);
    this.loadedBookingsGuestId.set(null);
    this.resetGuestNoteForm();
    this.updateGuestQueryParam(null);
  }

  saveGuestNote(): void {
    const guestId = this.getGuestRouteId(this.selectedGuest());
    const content = this.guestNoteContent().trim();

    if (!guestId) {
      this.guestNoteErrorMessage.set('No se pudo identificar al huésped para guardar la nota.');
      return;
    }

    if (!content) {
      this.guestNoteErrorMessage.set('Escribe una nota antes de guardarla.');
      return;
    }

    if (content.length > GUEST_NOTE_MAX_LENGTH) {
      this.guestNoteErrorMessage.set('La nota no puede superar los 280 caracteres.');
      return;
    }

    const payload: CreateCrmGuestNoteRequest = {
      note: content,
      type: this.guestNoteCategory(),
      status: 'not_pinned',
    };

    this.isSavingGuestNote.set(true);
    this.guestNoteErrorMessage.set(null);

    this.createCrmGuestNoteUseCase.execute(guestId, payload).subscribe({
      next: () => {
        this.isSavingGuestNote.set(false);
        this.resetGuestNoteForm();
      },
      error: () => {
        this.isSavingGuestNote.set(false);
        this.guestNoteErrorMessage.set('No se pudo guardar la nota. Inténtalo de nuevo.');
      },
    });
  }

  private buildGuestPanelPreview(guest: CrmGuest): GuestPanelPreview {
    const bookings = this.guestBookings();
    const totalSpend = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const statusLabel = guest.status === 'active' ? 'Activo' : 'Inactivo';
    const subtitle =
      bookings.length > 0
        ? `${bookings.length} reserva${bookings.length === 1 ? '' : 's'} registrada${bookings.length === 1 ? '' : 's'}`
        : 'Sin reservas registradas';

    return {
      subtitle,
      stats: [
        {
          label: 'Total reservas',
          value: bookings.length.toString(),
          icon: 'calendar',
        },
        {
          label: 'Gasto total',
          value: this.formatCurrency(totalSpend),
          icon: 'wallet',
        },
        {
          label: 'Estado',
          value: statusLabel,
          icon: 'status',
          tone: guest.status === 'active' ? 'success' : 'neutral',
        },
      ],
    };
  }

  private toGuestBookingPreview(booking: CrmGuestBooking): GuestBookingPreview {
    return {
      id: booking.id,
      propertyLabel: booking.propertyName || booking.propertyId || `Reserva ${booking.id}`,
      unitLabel: booking.unitName || booking.unitId || 'Unidad no disponible',
      dateRange: `${this.formatDateLabel(booking.checkIn)} - ${this.formatDateLabel(booking.checkOut)}`,
      amount: this.formatCurrency(booking.totalAmount),
      statusLabel: this.getBookingStatusLabel(booking.status),
      statusTone: this.getBookingStatusTone(booking.status),
      bookingDateLabel: this.formatDateLabel(booking.createdAt, true),
    };
  }

  private enrichBookingsWithNames(
    bookings: CrmGuestBooking[],
    requestedGuestId: string,
  ): void {
    const missingPropertyNames = bookings.some(
      (booking) => booking.propertyId && !booking.propertyName && !this.propertyNamesById()[booking.propertyId],
    );
    const propertyIdsForUnits = [
      ...new Set(
        bookings
          .filter(
            (booking) =>
              booking.propertyId &&
              booking.unitId &&
              !booking.unitName &&
              !this.unitNamesById()[booking.unitId] &&
              !this.loadedUnitPropertyIds().includes(booking.propertyId),
          )
          .map((booking) => booking.propertyId),
      ),
    ];

    const propertyNames$ = missingPropertyNames
      ? this.getPropertiesUseCase.execute().pipe(
          map((properties) => this.toPropertyNameMap(properties)),
          catchError(() => of({} as Record<string, string>)),
        )
      : of({} as Record<string, string>);

    const unitNames$ = propertyIdsForUnits.length
      ? forkJoin(
          propertyIdsForUnits.map((propertyId) =>
            this.getUnitsUseCase.execute(propertyId).pipe(
              map((units) => ({
                propertyId,
                units,
              })),
              catchError(() =>
                of({
                  propertyId,
                  units: [] as Unit[],
                }),
              ),
            ),
          ),
        )
      : of([] as Array<{ propertyId: string; units: Unit[] }>);

    forkJoin({
      propertyNames: propertyNames$,
      unitsByProperty: unitNames$,
    }).subscribe(({ propertyNames, unitsByProperty }) => {
      if (this.getGuestRouteId(this.selectedGuest()) !== requestedGuestId) {
        return;
      }

      const mergedPropertyNames = {
        ...this.propertyNamesById(),
        ...propertyNames,
      };
      const mergedUnitNames = {
        ...this.unitNamesById(),
        ...this.toUnitNameMap(unitsByProperty),
      };

      this.propertyNamesById.set(mergedPropertyNames);
      this.unitNamesById.set(mergedUnitNames);
      this.loadedUnitPropertyIds.set([
        ...new Set([...this.loadedUnitPropertyIds(), ...unitsByProperty.map(({ propertyId }) => propertyId)]),
      ]);
      this.guestBookings.set(
        bookings.map((booking) => ({
          ...booking,
          propertyName: booking.propertyName || mergedPropertyNames[booking.propertyId] || '',
          unitName: booking.unitName || mergedUnitNames[booking.unitId] || '',
        })),
      );
      this.isBookingsLoading.set(false);
      this.loadedBookingsGuestId.set(requestedGuestId);
    });
  }

  private toPropertyNameMap(properties: PropertyLookupItem[]): Record<string, string> {
    return properties.reduce<Record<string, string>>((propertyMap, property) => {
      const propertyId = property.id || property._id || property.propertyId || '';
      const propertyName = property.name || property.title || '';

      if (propertyId && propertyName) {
        propertyMap[propertyId] = propertyName;
      }

      return propertyMap;
    }, {});
  }

  private toUnitNameMap(
    unitsByProperty: Array<{ propertyId: string; units: UnitLookupItem[] }>,
  ): Record<string, string> {
    return unitsByProperty.reduce<Record<string, string>>((unitMap, { units }) => {
      for (const unit of units) {
        const unitId = unit.id || unit._id || unit.unitId || '';
        const unitName = unit.name || unit.unitName || unit.title || '';

        if (unitId && unitName) {
          unitMap[unitId] = unitName;
        }
      }

      return unitMap;
    }, {});
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
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

  private getBookingStatusLabel(status: CrmGuestBooking['status']): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmada';
      case 'CHECKED_IN':
        return 'Check-in';
      case 'CHECKED_OUT':
        return 'Check-out';
      case 'CANCELLED':
        return 'Cancelada';
      case 'NO_SHOW':
        return 'No se presentó';
      default:
        return 'Pendiente';
    }
  }

  private getBookingStatusTone(status: CrmGuestBooking['status']): BookingStatusTone {
    switch (status) {
      case 'CONFIRMED':
        return 'info';
      case 'CHECKED_IN':
      case 'CHECKED_OUT':
        return 'success';
      case 'NO_SHOW':
        return 'muted';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'warning';
    }
  }

  private syncSelectedGuestFromRoute(): void {
    const guestId = this.routeGuestId();

    if (!guestId) {
      this.selectedGuest.set(null);
      this.guestBookings.set([]);
      this.bookingsErrorMessage.set(null);
      this.isBookingsLoading.set(false);
      this.loadedBookingsGuestId.set(null);
      return;
    }

    const matchedGuest = this.guests().find((guest) => guest.id === guestId);
    this.selectedGuest.set(matchedGuest ?? null);
    if (matchedGuest && this.loadedBookingsGuestId() !== guestId) {
      this.loadGuestBookings(matchedGuest);
    } else if (!matchedGuest) {
      this.guestBookings.set([]);
      this.loadedBookingsGuestId.set(null);
    }
  }

  private getGuestRouteId(guest: CrmGuest | null): string | null {
    return guest?.id?.trim() || null;
  }

  private updateGuestQueryParam(guestId: string | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { guestId },
      queryParamsHandling: 'merge',
    });
  }

  private loadGuestBookings(guest: CrmGuest): void {
    const guestId = this.getGuestRouteId(guest);
    if (!guestId) {
      this.guestBookings.set([]);
      this.bookingsErrorMessage.set('No se pudo identificar al huésped para cargar reservas.');
      this.isBookingsLoading.set(false);
      return;
    }

    this.isBookingsLoading.set(true);
    this.bookingsErrorMessage.set(null);
    this.loadedBookingsGuestId.set(null);
    const requestedGuestId = guestId;

    this.getCrmGuestBookingsUseCase.execute(guestId).subscribe({
      next: (bookings) => {
        if (this.getGuestRouteId(this.selectedGuest()) !== requestedGuestId) {
          return;
        }

        this.enrichBookingsWithNames(bookings, requestedGuestId);
      },
      error: (error: HttpErrorResponse) => {
        if (this.getGuestRouteId(this.selectedGuest()) !== requestedGuestId) {
          return;
        }

        this.guestBookings.set([]);
        this.isBookingsLoading.set(false);
        if (error.status === 404) {
          this.bookingsErrorMessage.set('No se encontraron reservas para este huésped.');
        } else {
          this.bookingsErrorMessage.set(
            'No se pudo cargar el historial de reservas. Inténtalo de nuevo.',
          );
        }
      },
    });
  }

  private loadGuests(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.getCrmGuestsUseCase.execute().subscribe({
      next: (guests) => {
        this.guests.set(guests);
        this.loadLatestReservationDates(guests);
        this.syncSelectedGuestFromRoute();
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

  private resetGuestNoteForm(): void {
    this.isGuestNoteFormVisible.set(false);
    this.isSavingGuestNote.set(false);
    this.guestNoteCategory.set('general');
    this.guestNoteContent.set('');
    this.guestNoteErrorMessage.set(null);
  }
}
