import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBuilding,
  bootstrapCalendar,
  bootstrapCalendarCheck,
  bootstrapCalendarX,
  bootstrapCheckCircle,
  bootstrapClockHistory,
  bootstrapHouseDoorFill,
  bootstrapXCircle,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { GuestReservationResponse } from '@/domain/entities/guest-reservation.model';

@Component({
  selector: 'app-reservation-card',
  standalone: true,
  imports: [NgIcon, ButtonComponent],
  providers: [
    provideIcons({
      bootstrapBuilding,
      bootstrapCalendar,
      bootstrapCalendarCheck,
      bootstrapCalendarX,
      bootstrapCheckCircle,
      bootstrapClockHistory,
      bootstrapHouseDoorFill,
      bootstrapXCircle,
    }),
  ],
  templateUrl: './reservation-card.html',
  styleUrl: './reservation-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationCardComponent {
  readonly reservation = input.required<GuestReservationResponse>();

  readonly confirm = output<string>();
  readonly viewDetails = output<string>();

  readonly status = computed(() => this.reservation().status?.toLowerCase() ?? '');

  readonly nights = computed(() => {
    const r = this.reservation();
    if (r.nights) return r.nights;
    if (r.priceBreakdown?.nights) return r.priceBreakdown.nights;
    const a = new Date(r.checkIn);
    const b = new Date(r.checkOut);
    return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  });

  readonly bookingReference = computed(() => {
    const reference = this.reservation().bookingReference?.trim();
    if (reference) {
      return reference;
    }

    return this.reservation().id.slice(-8).toUpperCase();
  });

  readonly shortId = computed(() => this.reservation().id.slice(-8).toUpperCase());

  statusLabel(): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      checked_in: 'En estadía',
      checked_out: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No presentado',
    };
    return labels[this.status()] ?? this.status();
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

  formatDay(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
  }

  formatYear(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es', { year: 'numeric', timeZone: 'UTC' });
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('es', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  onConfirm(): void {
    this.confirm.emit(this.reservation().id);
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.reservation().id);
  }
}
