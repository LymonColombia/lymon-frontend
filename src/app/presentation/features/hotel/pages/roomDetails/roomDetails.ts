import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { GetPublicUnitUseCase } from '@/domain/use-cases/property/get-public-unit.use-case';
import { GetUnitCalendarUseCase } from '@/domain/use-cases/reservation/get-unit-calendar.use-case';
import { GetCartUseCase } from '@/domain/use-cases/cart/get-cart.use-case';
import { Unit } from '@/domain/entities/staff.model';
import { OccupiedDateRange } from '@/domain/entities/guest-reservation.model';
import { CartReservationItem } from '@/domain/entities/cart.model';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@/presentation/shared/components/breadcrumb/breadcrumb.component';
import { RoomHeroComponent } from './components/room-hero/room-hero.component';
import { RoomGeneralInfoComponent } from './components/room-general-info/room-general-info.component';
import { RoomAmenitiesComponent } from './components/room-amenities/room-amenities.component';
import { RoomPoliciesComponent } from './components/room-policies/room-policies.component';
import { CalendarComponent, DateRange } from '@/presentation/shared/components/calendar/calendar.component';
import { RoomRatingsComponent } from './components/room-ratings/room-ratings.component';
import { RoomDetailsNavComponent, RoomDetailsSearchParams } from './components/room-details-nav/room-details-nav.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapInfoCircle,
  bootstrapPeopleFill,
} from '@ng-icons/bootstrap-icons';
// Known arch violation: direct infra import for auth check — pending GetGuestSessionUseCase
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';
import { SaveReservationDraftUseCase } from '@/domain/use-cases/cart/save-reservation-draft.use-case';
import { formatPrice } from '@/presentation/shared/utils/price-formatter';

@Component({
  selector: 'app-room-details',
  standalone: true,
  imports: [
    ButtonComponent,
    SelectComponent,
    RoomDetailsNavComponent,
    FooterComponent,
    ModalComponent,
    BreadcrumbComponent,
    RoomHeroComponent,
    RoomGeneralInfoComponent,
    RoomAmenitiesComponent,
    RoomPoliciesComponent,
    CalendarComponent,
    RoomRatingsComponent,
    NgIconComponent,
  ],
  providers: [
    provideIcons({
      bootstrapInfoCircle,
      bootstrapPeopleFill,
    }),
  ],
  templateUrl: './roomDetails.html',
  styleUrl: './roomDetails.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomDetailsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly getPublicUnitUseCase = inject(GetPublicUnitUseCase);
  private readonly saveReservationDraftUseCase = inject(SaveReservationDraftUseCase);
  private readonly getUnitCalendarUseCase = inject(GetUnitCalendarUseCase);
  private readonly getCartUseCase = inject(GetCartUseCase);
  readonly guestTokenService = inject(GuestTokenService);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly unit = signal<Unit | null>(null);
  readonly occupiedRanges = signal<OccupiedDateRange[]>([]);
  readonly savingDraft = signal(false);
  readonly replaceConfirmation = signal<{ unit: Unit; existing: CartReservationItem } | null>(null);

  // Booking card signals
  readonly checkIn = signal<string | null>(null);
  readonly checkOut = signal<string | null>(null);
  readonly guestsCount = signal(1);

  readonly nights = computed(() => {
    const ci = this.checkIn();
    const co = this.checkOut();
    if (!ci || !co) return 0;
    const [cy, cm, cd] = ci.split('-').map(Number);
    const [oy, om, od] = co.split('-').map(Number);
    if ([cy, cm, cd, oy, om, od].some(Number.isNaN)) return 0;
    return Math.round(
      (new Date(oy, om - 1, od).getTime() - new Date(cy, cm - 1, cd).getTime()) / 86_400_000,
    );
  });

  readonly totalPrice = computed(() => this.nights() * (this.unit()?.pricePerNight ?? 0));

  readonly canReserve = computed(() => !!this.checkIn() && !!this.checkOut() && this.nights() > 0);

  readonly guestOptions = computed<SelectOption[]>(() => {
    const max = this.unit()?.maxGuests ?? 4;
    return Array.from({ length: max }, (_, i) => ({
      value: i + 1,
      label: i + 1 === 1 ? '1 Huésped' : `${i + 1} Huéspedes`,
    }));
  });

  readonly breadcrumbItems = computed<readonly BreadcrumbItem[]>(() => [
    { label: 'Habitaciones', route: '/booking' },
    { label: this.unit()?.name ?? 'Detalle de Habitación' },
  ]);

  readonly guestEmail = this.guestTokenService.getGuestEmail();

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('unitId')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((unitId) => {
        if (!unitId) {
          this.isLoading.set(false);
          this.errorMessage.set('No se recibió el identificador de la unidad.');
          return;
        }
        this.loadUnitDetails(unitId);
      });
  }

  private loadUnitDetails(unitId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.occupiedRanges.set([]);

    this.getPublicUnitUseCase.execute(unitId).pipe(
      switchMap((unit) => {
        this.unit.set(unit);
        this.isLoading.set(false);
        return this.getUnitCalendarUseCase.execute(unitId).pipe(
          catchError(() => of([] as OccupiedDateRange[])),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (ranges) => this.occupiedRanges.set(ranges),
      error: () => {
        this.unit.set(null);
        this.errorMessage.set('No se pudo cargar la información de la habitación.');
        this.isLoading.set(false);
      },
    });
  }

  onDateRangeChange(range: DateRange): void {
    this.checkIn.set(range.checkIn);
    this.checkOut.set(range.checkOut);
  }

  onGuestChange(value: string | number): void {
    this.guestsCount.set(Number(value));
  }

  onReserveNow(unit: Unit): void {
    if (!this.canReserve()) return;

    if (!this.guestTokenService.isAuthenticated()) {
      this.router.navigate(['/guest/login'], {
        queryParams: { returnUrl: `/room-details/${unit.id}` },
      });
      return;
    }

    this.errorMessage.set(null);

    this.getCartUseCase.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (cart) => {
        const existing = cart?.reservationItem;
        if (existing && existing.unitId !== unit.id) {
          this.replaceConfirmation.set({ unit, existing });
          return;
        }
        this.saveDraft(unit);
      },
      error: () => this.saveDraft(unit),
    });
  }

  confirmReplaceReservation(): void {
    const pending = this.replaceConfirmation();
    if (!pending) return;
    this.replaceConfirmation.set(null);
    this.saveDraft(pending.unit);
  }

  cancelReplaceReservation(): void {
    this.replaceConfirmation.set(null);
  }

  private saveDraft(unit: Unit): void {
    this.savingDraft.set(true);
    this.errorMessage.set(null);

    this.saveReservationDraftUseCase.execute({
      tenantId: unit.tenantId ?? '',
      propertyId: unit.propertyId ?? '',
      unitId: unit.id,
      checkIn: this.checkIn()!,
      checkOut: this.checkOut()!,
      guestsCount: this.guestsCount(),
      pricePerNight: unit.pricePerNight ?? 0,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.savingDraft.set(false);
        this.router.navigate(['/guest/cart']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.savingDraft.set(false);
        this.errorMessage.set(err?.error?.message ?? 'No se pudo guardar la reserva. Intenta de nuevo.');
      },
    });
  }

  onNavSearch(params: RoomDetailsSearchParams): void {
    this.router.navigate(['/booking'], {
      queryParams: { startDate: params.checkIn, endDate: params.checkOut, minGuests: params.guests },
    });
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

  protected readonly formatPrice = formatPrice;
}
