import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { BreadcrumbComponent, BreadcrumbItem } from '@/presentation/shared/components/breadcrumb/breadcrumb.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapCalendar,
  bootstrapCheckLg,
  bootstrapClock,
  bootstrapGeoAlt,
  bootstrapInfoCircle,
  bootstrapPatchCheckFill,
  bootstrapPeopleFill,
  bootstrapStarFill,
} from '@ng-icons/bootstrap-icons';
import { LocationMap } from '@/presentation/features/hotel/components/location-map/location-map';
import { ExperienceDetail,ExperienceReservationDraft } from '@/domain/entities/experience.model';

@Component({
  selector: 'experience-detail',
  standalone: true,
  imports: [BreadcrumbComponent, SelectComponent, NgIcon, LocationMap],
  providers: [
    provideIcons({
      bootstrapCalendar,
      bootstrapClock,
      bootstrapGeoAlt,
      bootstrapInfoCircle,
      bootstrapPatchCheckFill,
      bootstrapPeopleFill,
      bootstrapStarFill,
      bootstrapCheckLg
    }),
  ],
  templateUrl: './experience-detail.component.html',
  styleUrl: './experience-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceDetailComponent {
  private readonly availableDates = this.buildAvailableDates(12);

  readonly experience = input.required<ExperienceDetail>();
  readonly close = output<void>();

  readonly selectedDate = signal<string | null>(this.availableDates[0] ?? null);
  readonly guestsCount = signal(1);
  readonly reservationMessage = signal<string | null>(null);

  readonly breadcrumbItems = computed<readonly BreadcrumbItem[]>(() => [
    { label: 'Experiencias', route: '/experiences' },
    { label: this.experience().title },
  ]);

  readonly availableDateOptions = computed<SelectOption[]>(() =>
    this.availableDates.map((date) => ({
      value: date,
      label: this.formatDate(date),
    })),
  );

  readonly guestOptions = computed<SelectOption[]>(() => {
    const maxGuests = Math.max(1, this.experience().maxGuests ?? 1);
    return Array.from({ length: maxGuests }, (_, index) => {
      const total = index + 1;
      return {
        value: total,
        label: total === 1 ? '1 participante' : `${total} participantes`,
      };
    });
  });

  readonly generalInfoItems = computed(() => [
    { label: 'Categoria', value: this.experience().category },
    { label: 'Duracion', value: this.experience().duration },
    { label: 'Capacidad', value: this.experience().capacity },
    { label: 'Precio por persona', value: this.pricePerGuestLabel() },
  ]);

  readonly policyItems = computed(() => {
    const base = [
      'Cancelacion sin costo hasta 24 horas antes de la actividad.',
      'Presentate con al menos 20 minutos de anticipacion.',
      'El cupo se confirma al completar la reserva.',
    ];

    if (this.experience().hostCertified) {
      base.unshift('La experiencia es operada por un anfitrion certificado.');
    }

    return base;
  });

  readonly selectedDateLabel = computed(() => {
    const value = this.selectedDate();
    return value ? this.formatDate(value) : 'Sin seleccionar';
  });

  readonly pricePerGuestLabel = computed(() => this.formatCurrency(this.experience().priceFrom));

  readonly totalPrice = computed(() => this.experience().priceFrom * this.guestsCount());
  readonly totalPriceLabel = computed(() => this.formatCurrency(this.totalPrice()));

  readonly canReserve = computed(() => !!this.selectedDate() && this.guestsCount() > 0);

  onClose(): void {
    this.close.emit();
  }

  onDateChange(value: string | number): void {
    if (typeof value === 'number') {
      this.selectedDate.set(String(value));
      this.reservationMessage.set(null);
      return;
    }

    this.selectedDate.set(value);
    this.reservationMessage.set(null);
  }

  onGuestChange(value: string | number): void {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue)) {
      return;
    }

    const maxGuests = Math.max(1, this.experience().maxGuests ?? 1);
    this.guestsCount.set(Math.max(1, Math.min(nextValue, maxGuests)));
    this.reservationMessage.set(null);
  }

  onReserveNow(): void {
    if (!this.canReserve()) {
      return;
    }

    const reservation = this.buildReservationDraft();
    this.reservationMessage.set(
      `Reserva lista para ${reservation.guests} participante(s) el ${this.selectedDateLabel()}.`,
    );
  }

  private buildReservationDraft(): ExperienceReservationDraft {
    return {
      experienceId: this.experience().id,
      date: this.selectedDate() ?? '',
      guests: this.guestsCount(),
      total: this.totalPrice(),
    };
  }

  private buildAvailableDates(totalDays: number): string[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index + 1);
      return this.toIsoDate(date);
    });
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return value;
    }

    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
