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
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { GetPublicUnitUseCase } from '@/domain/use-cases/property/get-public-unit.use-case';
import { Unit } from '@/domain/entities/staff.model';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { HeaderComponent } from '@/presentation/shared/components/header/header.component';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@/presentation/shared/components/breadcrumb/breadcrumb.component';
import { RoomHeroComponent } from './components/room-hero/room-hero.component';
import { RoomGeneralInfoComponent } from './components/room-general-info/room-general-info.component';
import { RoomAmenitiesComponent } from './components/room-amenities/room-amenities.component';
import { RoomPoliciesComponent } from './components/room-policies/room-policies.component';
import { RoomBookingCalendarComponent, BookingDateRange } from './components/room-booking-calendar/room-booking-calendar.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapCalendar,
  bootstrapChevronLeft,
  bootstrapChevronRight,
  bootstrapInfoCircle,
  bootstrapPeopleFill,
  bootstrapSearch,
} from '@ng-icons/bootstrap-icons';
import { CheckoutState } from '../guest-checkout/guest-checkout';
// Known arch violation: direct infra import for auth check — pending GetGuestSessionUseCase
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';

@Component({
  selector: 'app-room-details',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    HeaderComponent,
    FooterComponent,
    BreadcrumbComponent,
    RoomHeroComponent,
    RoomGeneralInfoComponent,
    RoomAmenitiesComponent,
    RoomPoliciesComponent,
    RoomBookingCalendarComponent,
    NgIconComponent,
  ],
  providers: [
    provideIcons({
      bootstrapCalendar,
      bootstrapChevronLeft,
      bootstrapChevronRight,
      bootstrapInfoCircle,
      bootstrapPeopleFill,
      bootstrapSearch,
    }),
  ],
  templateUrl: './roomDetails.html',
  styleUrl: './roomDetails.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomDetailsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly getPublicUnitUseCase = inject(GetPublicUnitUseCase);
  private readonly guestTokenService = inject(GuestTokenService);

  // Header search form (navigates back to booking list)
  readonly searchForm: FormGroup = this.fb.group({
    checkIn: [''],
    checkOut: [''],
    guests: [2],
  });

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly unit = signal<Unit | null>(null);

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

  readonly headerGuestOptions: SelectOption[] = [
    { value: 1, label: '1 Huésped' },
    { value: 2, label: '2 Huéspedes' },
    { value: 3, label: '3 Huéspedes' },
    { value: 4, label: '4 Huéspedes' },
  ];

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

    this.getPublicUnitUseCase
      .execute(unitId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (unit) => {
          this.unit.set(unit);
          this.isLoading.set(false);
        },
        error: () => {
          this.unit.set(null);
          this.errorMessage.set('No se pudo cargar la información de la habitación.');
          this.isLoading.set(false);
        },
      });
  }

  onDateRangeChange(range: BookingDateRange): void {
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

    const state: CheckoutState = {
      unitId: unit.id,
      tenantId: unit.tenantId,
      propertyId: unit.propertyId,
      unitName: unit.name,
      checkIn: this.checkIn()!,
      checkOut: this.checkOut()!,
      guestsCount: this.guestsCount(),
      pricePerNight: unit.pricePerNight ?? 0,
      nights: this.nights(),
      total: this.totalPrice(),
    };

    this.router.navigate(['/guest/checkout'], { state });
  }

  onSearch(): void {
    const v = this.searchForm.value;
    this.router.navigate(['/booking'], {
      queryParams: { checkIn: v.checkIn, checkOut: v.checkOut, guests: v.guests },
    });
  }

  onGoBack(): void {
    this.router.navigate(['/booking']);
  }
}
