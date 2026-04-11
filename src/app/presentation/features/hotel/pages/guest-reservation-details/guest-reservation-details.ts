import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBuilding,
  bootstrapCalendar,
  bootstrapCalendarCheck,
  bootstrapCalendarX,
  bootstrapCheckCircle,
  bootstrapClockHistory,
  bootstrapExclamationTriangle,
  bootstrapHash,
  bootstrapHouseDoorFill,
  bootstrapMoon,
  bootstrapXCircle,
} from '@ng-icons/bootstrap-icons';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { GuestNavComponent } from '@/presentation/features/hotel/components/guest-nav/guest-nav';
import { GetGuestReservationByIdUseCase } from '@/domain/use-cases/reservation/get-guest-reservation-by-id.use-case';
import { GuestReservationResponse } from '@/domain/entities/guest-reservation.model';
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';

@Component({
  selector: 'app-guest-reservation-details',
  standalone: true,
  imports: [GuestNavComponent, FooterComponent, ButtonComponent, NgIcon],
  providers: [
    provideIcons({
      bootstrapBuilding,
      bootstrapCalendar,
      bootstrapCalendarCheck,
      bootstrapCalendarX,
      bootstrapCheckCircle,
      bootstrapClockHistory,
      bootstrapExclamationTriangle,
      bootstrapHash,
      bootstrapHouseDoorFill,
      bootstrapMoon,
      bootstrapXCircle,
    }),
  ],
  templateUrl: './guest-reservation-details.html',
  styleUrl: './guest-reservation-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestReservationDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getReservationByIdUseCase = inject(GetGuestReservationByIdUseCase);
  private readonly guestTokenService = inject(GuestTokenService);

  readonly reservation = signal<GuestReservationResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly guestEmail = this.guestTokenService.getGuestEmail() ?? '';

  readonly status = computed(() => this.reservation()?.status?.toLowerCase() ?? '');

  readonly shortBookingReference = computed(() => {
    const reference = this.bookingReference();
    if (!reference || reference === '-') {
      return '-';
    }

    return reference.slice(-12).toUpperCase();
  });

  readonly bookingReference = computed(() => {
    const reservation = this.reservation();
    if (!reservation) {
      return '-';
    }

    const reference = reservation.bookingReference?.trim();
    if (reference) {
      return reference;
    }

    return reservation.id.slice(-8).toUpperCase();
  });

  readonly nights = computed(() => {
    const reservation = this.reservation();
    if (!reservation) {
      return 0;
    }

    if (reservation.nights) return reservation.nights;
    if (reservation.priceBreakdown?.nights) return reservation.priceBreakdown.nights;

    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    return Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  });

  readonly hasPendingStatus = computed(() => this.status() === 'pending');

  constructor() {
    const reservationId = this.route.snapshot.paramMap.get('id');

    if (!reservationId) {
      this.errorMessage.set('No se encontró el identificador de la reserva.');
      this.isLoading.set(false);
      return;
    }

    this.loadReservation(reservationId);
  }

  retryLoad(): void {
    const reservationId = this.route.snapshot.paramMap.get('id');
    if (!reservationId) {
      return;
    }

    this.loadReservation(reservationId);
  }

  onLogout(): void {
    this.guestTokenService.clear();
    void this.router.navigate(['/guest/login']);
  }

  goExplore(): void {
    void this.router.navigate(['/booking']);
  }

  goToCheckin(): void {
    const reservationId = this.reservation()?.id;
    if (!reservationId) {
      return;
    }

    void this.router.navigate(['/guest/checkin'], { queryParams: { reservationId } });
  }

  goBackToReservations(): void {
    void this.router.navigate(['/guest/reservations']);
  }

  statusLabel(): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      checked_in: 'En estadia',
      checked_out: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No presentado',
    };

    return labels[this.status()] ?? this.status() ?? '-';
  }

  statusClass(): string {
    return `status-${this.status() || 'unknown'}`;
  }

  statusIcon(): string {
    const icons: Record<string, string> = {
      pending: 'bootstrapClockHistory',
      confirmed: 'bootstrapCalendarCheck',
      checked_in: 'bootstrapHouseDoorFill',
      checked_out: 'bootstrapCheckCircle',
      cancelled: 'bootstrapXCircle',
      no_show: 'bootstrapCalendarX',
    };

    return icons[this.status()] ?? 'bootstrapCalendar';
  }

  formatFullDate(dateStr?: string | null): string {
    if (!dateStr) {
      return '-';
    }

    return new Date(dateStr).toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  formatDayNumber(dateStr?: string | null): string {
    if (!dateStr) {
      return '-';
    }

    return new Date(dateStr).toLocaleDateString('es', {
      day: '2-digit',
      timeZone: 'UTC',
    });
  }

  formatDayName(dateStr?: string | null): string {
    if (!dateStr) {
      return '-';
    }

    return new Date(dateStr).toLocaleDateString('es', {
      weekday: 'long',
      timeZone: 'UTC',
    });
  }

  formatMonthYear(dateStr?: string | null): string {
    if (!dateStr) {
      return '-';
    }

    return new Date(dateStr).toLocaleDateString('es', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  private loadReservation(reservationId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.getReservationByIdUseCase.execute(reservationId).subscribe({
      next: (reservation) => {
        this.reservation.set(reservation);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el detalle de la reserva. Intenta de nuevo.');
        this.isLoading.set(false);
      },
    });
  }
}
