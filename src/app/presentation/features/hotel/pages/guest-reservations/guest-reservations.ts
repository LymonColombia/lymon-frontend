import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapCalendar,
  bootstrapCalendarCheck,
  bootstrapCalendarX,
  bootstrapChevronLeft,
  bootstrapChevronRight,
  bootstrapClockHistory,
  bootstrapExclamationTriangle,
  bootstrapHouseDoorFill,
  bootstrapPeopleFill,
  bootstrapPersonCheck,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { GetGuestReservationsUseCase } from '@/domain/use-cases/reservation/get-guest-reservations.use-case';
import { GuestReservationResponse } from '@/domain/entities/guest-reservation.model';

const ITEMS_PER_PAGE = 10;

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | string;

@Component({
  selector: 'app-guest-reservations',
  standalone: true,
  imports: [ButtonComponent, FooterComponent, NgIcon],
  providers: [
    provideIcons({
      bootstrapCalendar,
      bootstrapCalendarCheck,
      bootstrapCalendarX,
      bootstrapChevronLeft,
      bootstrapChevronRight,
      bootstrapClockHistory,
      bootstrapExclamationTriangle,
      bootstrapHouseDoorFill,
      bootstrapPeopleFill,
      bootstrapPersonCheck,
    }),
  ],
  templateUrl: './guest-reservations.html',
  styleUrl: './guest-reservations.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestReservationsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly getReservationsUseCase = inject(GetGuestReservationsUseCase);

  readonly reservations = signal<GuestReservationResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);

  ngOnInit(): void {
    this.loadReservations(1);
  }

  loadReservations(page: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.getReservationsUseCase.execute({ page, limit: ITEMS_PER_PAGE }).subscribe({
      next: ({ reservations, pagination }) => {
        this.reservations.set(reservations);
        this.currentPage.set(pagination.page);
        this.totalPages.set(pagination.totalPages);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar tus reservas. Intenta de nuevo.');
        this.isLoading.set(false);
      },
    });
  }

  onPrevPage(): void {
    const prev = this.currentPage() - 1;
    if (prev >= 1) this.loadReservations(prev);
  }

  onNextPage(): void {
    const next = this.currentPage() + 1;
    if (next <= this.totalPages()) this.loadReservations(next);
  }

  goBack(): void {
    this.router.navigate(['/booking']);
  }

  goToCheckin(reservationId: string): void {
    void this.router.navigate(['/guest/checkin'], { queryParams: { reservationId } });
  }

  statusLabel(status: ReservationStatus): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      checked_in: 'En estadía',
      checked_out: 'Finalizada',
      cancelled: 'Cancelada',
    };
    return labels[status] ?? status;
  }

  statusIcon(status: ReservationStatus): string {
    const icons: Record<string, string> = {
      pending: 'bootstrapClockHistory',
      confirmed: 'bootstrapCalendarCheck',
      checked_in: 'bootstrapHouseDoorFill',
      checked_out: 'bootstrapCalendarX',
      cancelled: 'bootstrapCalendarX',
    };
    return icons[status] ?? 'bootstrapCalendar';
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }

  formatDateShort(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  }

  nightsBetween(checkIn: string, checkOut: string): number {
    const a = new Date(checkIn);
    const b = new Date(checkOut);
    return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  }
}
