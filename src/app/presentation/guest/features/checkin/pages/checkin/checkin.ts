import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GuestNavComponent } from '@/presentation/guest/layout/guest-nav/guest-nav';
import { InputComponent } from '@/presentation/shared/components/input/input';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { CheckinGuestFormComponent } from './components/checkin-guest-form/checkin-guest-form';
import { CheckinSummaryComponent } from './components/checkin-summary/checkin-summary';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { Reservation } from '@/domain/entities/reservation.model';
import { GetReservationsUseCase } from '@/domain/use-cases/reservation/get-reservations.use-case';
import { GetReservationByIdUseCase } from '@/domain/use-cases/reservation/get-reservation-by-id.use-case';
import { GetGuestReservationByIdUseCase } from '@/domain/use-cases/guest-reservation/get-guest-reservation-by-id.use-case';
import { ConfirmReservationUseCase } from '@/domain/use-cases/reservation/confirm-reservation.use-case';
import { GuestReservationResponse } from '@/domain/entities/guest-reservation.model';
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';
import { formatCalendarDate } from '@/presentation/shared/utils/date-formatter.util';
import {
  bootstrapCardText,
  bootstrapShieldCheck,
} from '@ng-icons/bootstrap-icons';
import {
  catchError,
  combineLatest,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';

interface GuestFormValue {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const GUEST_ROUTE_PREFIX = '/guest/';
const ACTIVE_RESERVATION_STATUSES: ReadonlyArray<Reservation['status']> = ['active', 'confirmed', 'pending'];
const RESERVATION_STATUSES: ReadonlyArray<Reservation['status']> = [
  'active',
  'pending',
  'finished',
  'confirmed',
  'cancelled',
];

function isReservationStatus(value: string): value is Reservation['status'] {
  return (RESERVATION_STATUSES as readonly string[]).includes(value);
}

@Component({
  imports: [
    ReactiveFormsModule,
    GuestNavComponent,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    CheckinGuestFormComponent,
    CheckinSummaryComponent,
    NgIcon,
  ],
  providers: [
    provideIcons({
      bootstrapCardText,
      bootstrapShieldCheck,
    }),
  ],
  selector: 'app-checkin',
  standalone: true,
  templateUrl: './checkin.html',
  styleUrls: ['./checkin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckinComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly getReservationsUseCase = inject(GetReservationsUseCase);
  private readonly getReservationByIdUseCase = inject(GetReservationByIdUseCase);
  private readonly getGuestReservationByIdUseCase = inject(GetGuestReservationByIdUseCase);
  private readonly confirmReservationUseCase = inject(ConfirmReservationUseCase);
  private readonly guestTokenService = inject(GuestTokenService);

  readonly steps = ['Información de huéspedes', 'Datos legales', 'Confirmación'] as const;

  readonly currentStep = signal(1);
  readonly totalSteps = this.steps.length;

  readonly progressPercent = computed(() => (this.currentStep() / this.totalSteps) * 100);
  readonly currentStepLabel = computed(() => this.steps[this.currentStep() - 1]);
  readonly isFirstStep = computed(() => this.currentStep() === 1);
  readonly isLastStep = computed(() => this.currentStep() === this.totalSteps);

  readonly isLoadingSummary = signal(true);
  readonly summaryError = signal<string | null>(null);

  readonly selectedReservation = signal<Reservation | null>(null);

  readonly reservationSummary = computed(() => {
    const reservation = this.selectedReservation();

    return {
      guestName: reservation?.guestName || reservation?.guestId || 'Sin nombre',
      room: reservation?.room || reservation?.unitId || 'Sin habitacion',
      checkIn: this.formatDate(reservation?.checkIn),
      checkOut: this.formatDate(reservation?.checkOut),
      nights: reservation?.nights ?? 0,
      guests: reservation?.guestsCount ?? 0,
      total: this.formatCurrency(reservation?.totalPrice ?? 0),
    };
  });

  readonly isConfirming = signal(false);
  readonly confirmError = signal<string | null>(null);

  readonly guestEmail = this.guestTokenService.getGuestEmail() ?? '';

  readonly idTypeOptions: SelectOption[] = [
    { value: 'CC', label: 'Cédula de ciudadanía' },
    { value: 'TI', label: 'Tarjeta de identidad' },
    { value: 'RC', label: 'Registro civil' },
    { value: 'PASSPORT', label: 'Pasaporte' },
  ];

  readonly checkinForm = this.fb.group({
    guests: this.fb.array<FormGroup>([]),
    identification: this.fb.group({
      idType: [''],
      idNumber: [''],
    }),
    acceptedTerms: [false, Validators.requiredTrue],
  });

  get guests(): FormArray<FormGroup> {
    return this.checkinForm.controls.guests;
  }

  constructor() {
    this.loadSummaryData();
  }

  goToPreviousStep(): void {
    this.currentStep.update((step) => Math.max(1, step - 1));
  }

  goToNextStep(): void {
    this.currentStep.update((step) => Math.min(this.totalSteps, step + 1));
  }

  submitCheckin(): void {
    if (!this.checkinForm.controls.acceptedTerms.value) {
      this.checkinForm.markAllAsTouched();
      return;
    }

    const reservationId = this.selectedReservation()?.id;
    if (!reservationId) {
      this.confirmError.set('No se encontró la reservación a confirmar.');
      return;
    }

    this.isConfirming.set(true);
    this.confirmError.set(null);

    this.confirmReservationUseCase
      .execute(reservationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isConfirming.set(false);
          void this.router.navigate(['/guest/reservations']);
        },
        error: () => {
          this.isConfirming.set(false);
          this.confirmError.set('No se pudo confirmar la reservación. Intenta de nuevo.');
        },
      });
  }

  onLogout(): void {
    this.guestTokenService.clear();
    void this.router.navigate(['/guest/login']);
  }

  goExplore(): void {
    void this.router.navigate(['/booking']);
  }

  private loadSummaryData(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        map(([params, query]) => query.get('reservationId') || params.get('reservationId')),
        tap(() => {
          this.isLoadingSummary.set(true);
          this.summaryError.set(null);
        }),
        switchMap((reservationId) => this.fetchReservation(reservationId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((reservation) => {
        this.selectedReservation.set(reservation);
        this.isLoadingSummary.set(false);
        this.syncGuestForms(reservation);

        if (!reservation) {
          this.summaryError.set('No se encontro una reservacion para mostrar.');
        }
      });
  }

  private syncGuestForms(reservation: Reservation | null): void {
    const guestsCount = Math.max(1, reservation?.guestsCount ?? 1);
    const tokenProfile = this.guestTokenService.getGuestProfile();

    this.guests.clear();
    this.guests.push(
      this.buildGuestGroup({
        firstName: tokenProfile.firstName ?? '',
        lastName: tokenProfile.lastName ?? '',
        email: tokenProfile.email ?? '',
        phone: '',
      }),
    );

    for (let i = 1; i < guestsCount; i++) {
      this.guests.push(this.buildGuestGroup());
    }
  }

  private buildGuestGroup(prefill?: Partial<GuestFormValue>): FormGroup {
    return this.fb.group({
      firstName: [prefill?.firstName ?? ''],
      lastName: [prefill?.lastName ?? ''],
      email: [prefill?.email ?? '', Validators.email],
      phone: [prefill?.phone ?? ''],
    });
  }

  private fetchReservation(reservationId: string | null): Observable<Reservation | null> {
    if (reservationId?.trim()) {
      const isGuestRoute = this.router.url.startsWith(GUEST_ROUTE_PREFIX);

      if (isGuestRoute) {
        return this.getGuestReservationByIdUseCase.execute(reservationId).pipe(
          map((r) => this.mapGuestReservation(r)),
          catchError(() => {
            this.summaryError.set('No se encontro la reservacion indicada.');
            return of(null);
          }),
        );
      }

      return this.getReservationByIdUseCase.execute(reservationId).pipe(
        catchError(() => {
          this.summaryError.set('No se encontro la reservacion indicada.');
          return of(null);
        }),
      );
    }

    return this.getReservationsUseCase.execute().pipe(
      map(({ reservations }) => this.selectFallbackReservation(reservations)),
      catchError(() => of(null)),
    );
  }

  private mapGuestReservation(r: GuestReservationResponse): Reservation {
    return {
      id: r.id,
      unitId: r.unitId,
      room: r.unitName,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      nights: r.nights ?? r.priceBreakdown?.nights ?? 0,
      guestsCount: r.guestsCount,
      pricePerNight: r.priceBreakdown?.pricePerNight ?? 0,
      totalPrice: r.priceBreakdown?.totalPrice ?? 0,
      notes: r.notes ?? undefined,
      status: isReservationStatus(r.status) ? r.status : 'pending',
      tenantId: '',
      propertyId: r.propertyId ?? '',
      guestId: '',
      source: r.source ?? '',
      createdAt: '',
      updatedAt: '',
    };
  }

  private selectFallbackReservation(reservations: Reservation[]): Reservation | null {
    if (!Array.isArray(reservations) || reservations.length === 0) {
      return null;
    }

    const activeReservation = reservations.find((reservation) =>
      ACTIVE_RESERVATION_STATUSES.includes(reservation.status),
    );

    return activeReservation ?? reservations[0];
  }

  private formatDate(value: string | undefined): string {
    if (!value) {
      return '--';
    }

    if (Number.isNaN(new Date(value).getTime())) {
      return value;
    }

    return formatCalendarDate(value, { day: '2-digit', month: 'short', year: 'numeric' }, 'es-MX');
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  }
}
