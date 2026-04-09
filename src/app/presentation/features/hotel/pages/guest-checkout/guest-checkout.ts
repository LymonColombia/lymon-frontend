import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapCalendar,
  bootstrapCheckCircle,
  bootstrapCheckCircleFill,
  bootstrapChevronLeft,
  bootstrapExclamationTriangle,
  bootstrapPeopleFill,
  bootstrapShield,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { CreateGuestReservationUseCase } from '@/domain/use-cases/reservation/create-guest-reservation.use-case';

export interface CheckoutState {
  unitId: string;
  tenantId: string | undefined;
  propertyId: string | undefined;
  unitName: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  pricePerNight: number;
  nights: number;
  total: number;
}

@Component({
  selector: 'app-guest-checkout',
  standalone: true,
  imports: [ButtonComponent, FooterComponent, FormsModule, NgIcon],
  providers: [provideIcons({
    bootstrapCalendar,
    bootstrapCheckCircle,
    bootstrapCheckCircleFill,
    bootstrapChevronLeft,
    bootstrapExclamationTriangle,
    bootstrapPeopleFill,
    bootstrapShield,
  })],
  templateUrl: './guest-checkout.html',
  styleUrl: './guest-checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestCheckoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly createReservationUseCase = inject(CreateGuestReservationUseCase);

  readonly info = signal<CheckoutState | null>(null);
  readonly isLoading = signal(false);
  readonly isSuccess = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly notes = signal('');

  ngOnInit(): void {
    const state = history.state as Partial<CheckoutState>;
    if (state?.unitId && state?.checkIn && state?.checkOut) {
      this.info.set(state as CheckoutState);
    }
  }

  onNotesChange(value: string): void {
    this.notes.set(value);
  }

  confirmReservation(): void {
    const info = this.info();
    if (!info) return;

    if (!info.tenantId || !info.propertyId) {
      this.errorMessage.set('No se pudo obtener la información completa de la unidad. Vuelve e intenta de nuevo.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.createReservationUseCase
      .execute({
        tenantId: info.tenantId,
        propertyId: info.propertyId,
        unitId: info.unitId,
        checkIn: info.checkIn,
        checkOut: info.checkOut,
        guestsCount: info.guestsCount,
        notes: this.notes() || undefined,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.isSuccess.set(true);
        },
        error: (err: { error?: { message?: string } }) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Ocurrió un error al crear la reserva. Intenta de nuevo.');
        },
      });
  }

  goBack(): void {
    const unitId = this.info()?.unitId;
    if (unitId) {
      this.router.navigate(['/room-details', unitId]);
    } else {
      this.router.navigate(['/booking']);
    }
  }

  goToBooking(): void {
    this.router.navigate(['/booking']);
  }

  formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
}
