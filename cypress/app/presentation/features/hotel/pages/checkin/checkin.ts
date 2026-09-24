import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { Reservation } from '@/domain/entities/reservation.model';
import { GetReservationsUseCase } from '@/domain/use-cases/reservation/get-reservations.use-case';
import { GetReservationByIdUseCase } from '@/domain/use-cases/reservation/get-reservation-by-id.use-case';
import { GetGuestReservationByIdUseCase } from '@/domain/use-cases/reservation/get-guest-reservation-by-id.use-case';
import { GuestReservationResponse } from '@/domain/entities/guest-reservation.model';
import {
  bootstrapEnvelope,
  bootstrapTelephone,
  bootstrapPerson,
  bootstrapCardText,
  bootstrapShieldCheck,
  bootstrapPen,
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

@Component({
  imports: [HotelPageLayoutComponent, NgIcon],
  providers: [
    provideIcons({
      bootstrapEnvelope,
      bootstrapTelephone,
      bootstrapPerson,
      bootstrapCardText,
      bootstrapShieldCheck,
      bootstrapPen,
    }),
  ],
  selector: 'app-checkin',
  standalone: true,
  templateUrl: './checkin.html',
  styleUrls: ['./checkin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckinComponent implements AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly getReservationsUseCase = inject(GetReservationsUseCase);
  private readonly getReservationByIdUseCase = inject(GetReservationByIdUseCase);
  private readonly getGuestReservationByIdUseCase = inject(GetGuestReservationByIdUseCase);

  @ViewChild('signatureCanvas')
  private readonly signatureCanvas?: ElementRef<HTMLCanvasElement>;

  private signatureContext: CanvasRenderingContext2D | null = null;
  private isDrawing = false;

  readonly steps = [
    'Informacion personal',
    'Datos legales',
    'Contacto de emergencia',
    'Firma y confirmacion',
  ] as const;

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
      checkIn: this.formatDateTime(reservation?.checkIn),
      checkOut: this.formatDateTime(reservation?.checkOut),
      nights: reservation?.nights ?? 0,
      guests: reservation?.guestsCount ?? 0,
      total: this.formatCurrency(reservation?.totalPrice ?? 0),
    };
  });

  readonly selectedIdentityFileName = signal('Ningun archivo seleccionado');

  constructor() {
    this.loadSummaryData();
  }

  goToPreviousStep(): void {
    this.currentStep.update((step) => Math.max(1, step - 1));
    this.trySetupSignatureCanvas();
  }

  goToNextStep(): void {
    this.currentStep.update((step) => Math.min(this.totalSteps, step + 1));
    this.trySetupSignatureCanvas();
  }

  submitCheckin(): void {
    console.info('Check-in listo para enviar.');
  }

  ngAfterViewInit(): void {
    this.setupSignatureCanvas();
  }

  onIdentityFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);

    this.selectedIdentityFileName.set(file?.name ?? 'Ningun archivo seleccionado');
  }

  startDrawing(event: PointerEvent): void {
    if (!this.signatureContext) return;

    const point = this.getCanvasPoint(event);
    this.isDrawing = true;

    this.signatureContext.beginPath();
    this.signatureContext.moveTo(point.x, point.y);
    (event.target as Element).setPointerCapture?.(event.pointerId);
  }

  draw(event: PointerEvent): void {
    if (!this.signatureContext || !this.isDrawing) return;

    const point = this.getCanvasPoint(event);
    this.signatureContext.lineTo(point.x, point.y);
    this.signatureContext.stroke();
  }

  stopDrawing(): void {
    if (!this.signatureContext) return;

    this.signatureContext.closePath();
    this.isDrawing = false;
  }

  clearSignature(): void {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas || !this.signatureContext) return;

    this.signatureContext.clearRect(0, 0, canvas.width, canvas.height);
  }

  private setupSignatureCanvas(): void {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = globalThis.devicePixelRatio || 1;

    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#214a2d';
    this.signatureContext = ctx;
  }

  private trySetupSignatureCanvas(): void {
    if (this.currentStep() !== 4) return;

    requestAnimationFrame(() => {
      this.setupSignatureCanvas();
    });
  }

  private getCanvasPoint(event: PointerEvent): { x: number; y: number } {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
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

        if (!reservation) {
          this.summaryError.set('No se encontro una reservacion para mostrar.');
        }
      });
  }

  private fetchReservation(reservationId: string | null): Observable<Reservation | null> {
    if (reservationId?.trim()) {
      const isGuestRoute = this.router.url.startsWith('/guest/');

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
      map((reservations) => this.selectFallbackReservation(reservations)),
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
      status: r.status as Reservation['status'],
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
      ['active', 'confirmed', 'pending'].includes(reservation.status),
    );

    return activeReservation ?? reservations[0];
  }

  private formatDateTime(value: string | undefined): string {
    if (!value) {
      return '--';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  }
}
