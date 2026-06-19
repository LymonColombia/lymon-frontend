import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { BreadcrumbComponent, BreadcrumbItem } from '@/presentation/shared/components/breadcrumb/breadcrumb.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapCalendar, bootstrapGeoAlt, bootstrapGeoAltFill, bootstrapPeopleFill, bootstrapSignpostSplit, bootstrapStar } from '@ng-icons/bootstrap-icons';
import { LocationMap } from '@/presentation/features/hotel/components/location-map/location-map';
import { GuestExperience } from '@/domain/entities/guest-experience.model';
import { AddCartExperienceItemUseCase } from '@/domain/use-cases/cart/add-cart-experience-item.use-case';


interface AvailabilitySlot {
  date: string;
  startTime: string | null;
  endTime: string | null;
}

/** Tope  para DATE_RANGE. */
const MAX_DATE_RANGE_DAYS = 20;
/** Tope de fechas a generar para  RECURRING. */
const MAX_RECURRING_RESULTS = 12;
/** Ventana de búsqueda (en días hacia adelante) para experiencias RECURRING. */
const RECURRING_SEARCH_WINDOW_DAYS = 15;

const EMPTY_END_TIME='00:00'

@Component({
  selector: 'experience-detail',
  standalone: true,
  imports: [BreadcrumbComponent, SelectComponent, NgIcon, LocationMap],
  providers: [
    provideIcons({
      bootstrapCalendar,
      bootstrapGeoAlt,
      bootstrapPeopleFill,
      bootstrapStar,
      bootstrapSignpostSplit,
      bootstrapGeoAltFill,
    }),
  ],
  templateUrl: './experience-detail.component.html',
  styleUrl: './experience-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceDetailComponent {

  readonly experience = input.required<GuestExperience>();

  readonly addExperienceItemToCart= inject(AddCartExperienceItemUseCase )

  readonly selectedDate = signal<string | null>(null);
  readonly guestsCount = signal(1);
  readonly reservationMessage = signal<string | null>(null);

  readonly breadcrumbItems = computed<readonly BreadcrumbItem[]>(() => [
    { label: 'Experiencias', route: '/experiences' },
    { label: this.experience().name },
  ]);

  readonly availableSlots = computed(() => this.buildAvailableSlots(this.experience()));

  /** Fechas únicas disponiblesderivadas de los slots (sin duplicar por hora). */
  readonly availableDates = computed(() => {
    const seen = new Set<string>();
    const dates: string[] = [];
    for (const slot of this.availableSlots()) {
      if (!seen.has(slot.date)) {
        seen.add(slot.date);
        dates.push(slot.date);
      }
    }
    return dates;
  });

  readonly availableDateOptions = computed<SelectOption[]>(() =>
    this.availableDates().map((date) => ({
      value: date,
      label: this.formatDate(date),
    })),
  );

  // PARTICIPANTES
  readonly guestOptions = computed<SelectOption[]>(() => {
    const maxGuests = Math.max(1, this.experience().capacity ?? 1);
    return Array.from({ length: maxGuests }, (_, index) => {
      const total = index + 1;
      return {
        value: total,
        label: total === 1 ? '1 participante' : `${total} participantes`,
      };
    });
  });


  readonly generalInfoItems = computed(() => {
    const experience = this.experience();
    return [
      { label: 'Categoria', value: this.getCategoryLabel(experience.category) },
      { label: 'Duracion', value: this.getDurationLabel(experience.durationHours) },
      { label: 'Capacidad', value: this.getCapacityLabel(experience.capacity) },
      { label: 'Precio', value: this.formatCurrency(experience.priceCop) },
    ];
  });

  readonly selectedDateLabel = computed(() => {
    const value = this.selectedDate();
    return value ? this.formatDate(value) : 'Sin seleccionar';
  });

  readonly priceLabel = computed(() => this.formatCurrency(this.experience().priceCop));
  readonly totalPrice = computed(() => this.experience().priceCop * this.guestsCount());
  readonly totalPriceLabel = computed(() => this.formatCurrency(this.totalPrice()));

  readonly locationPointLabel = computed(() => this.experience().location.label || 'Punto de encuentro');
  readonly locationAddressLabel = computed(
    () => this.experience().location.address || this.experience().location.label || 'Sin direccion disponible',
  );

  constructor() {
    // Cada vez que cambia la experiencia reseteamos toda la selección del usuario para
    // que no queden fecha/hora/participantes de una experiencia anterior.
    effect(() => {
      const dates = this.availableDates();
      this.selectedDate.set(dates[0] ?? null);
      this.guestsCount.set(1);
      this.reservationMessage.set(null);
    });
  }


  onDateChange(value: string | number): void {
    this.selectedDate.set(String(value));
    this.reservationMessage.set(null);
  }

  onGuestChange(value: string | number): void {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue)) {
      return;
    }

    const maxGuests = Math.max(1, this.experience().capacity ?? 1);
    this.guestsCount.set(Math.max(1, Math.min(nextValue, maxGuests)));
    this.reservationMessage.set(null);
  }

  onReserveNow(): void {
    if (!this.selectedDate()) {
      this.reservationMessage.set('Selecciona una fecha disponible para continuar.');
      return;
    }
    this.reservationMessage.set(
      `Reserva lista para ${this.guestsCount()} participante(s) el ${this.selectedDateLabel()}.`,
    );
  }

  private buildAvailableSlots(experience: GuestExperience): AvailabilitySlot[] {
    switch (experience.availabilityType) {
      case 'ONE_TIME':
        return this.buildOneTimeSlots(experience.startAt, experience.endAt);

      case 'DATE_RANGE':
        return this.buildDateRangeSlots(
          experience.startAt,
          experience.endAt,
          experience.blackoutRanges ?? [],
        );

      case 'RECURRING':
        return experience.recurrence
          ? this.buildRecurringSlots(experience.recurrence, experience.blackoutRanges ?? [])
          : [];

      default:
        return [];
    }
  }


  /** ISO a texto legible en español  "19 jun. 2026". */
  private formatDate(value: string): string {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parsed);
  }

 
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private getDurationLabel(durationHours: number): string {
    return `${durationHours} hora${durationHours === 1 ? '' : 's'}`;
  }

  private getCapacityLabel(capacity: number): string {
    return `${capacity} persona${capacity === 1 ? '' : 's'}`;
  }

  private getCategoryLabel(category: string): string {
    const normalized = category.trim().toUpperCase();

    if (normalized === 'TRANSPORTATION') {
      return 'Transporte';
    }

    const fallback = normalized.toLowerCase();
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
  }

  
  /**
   * ONE_TIME
  **/
  private buildOneTimeSlots(
    startAt: string | null,
    endAt: string | null,
  ): AvailabilitySlot[] {
    if (!startAt) return [];
 
    return [
      {
        date:      this.isoDatePart(startAt),
        startTime: this.isoTimePart(startAt),
        endTime:   endAt ? this.isoTimePart(endAt) : null,
      },
    ];
  }
 
  /**
   * DATE_RANGE
   */
  private buildDateRangeSlots(
    startAt: string | null,
    endAt: string | null,
    blackoutRanges: Array<{ startAt: string; endAt: string }>,
  ): AvailabilitySlot[] {
    if (!startAt || !endAt) return [];
 
    const startDateStr = this.isoDatePart(startAt);
    const endDateStr   = this.isoDatePart(endAt);
 
  
    const cursor    = this.localMidnight(startDateStr);
    const finalDate = this.localMidnight(endDateStr);
 
    if (Number.isNaN(cursor.getTime()) || Number.isNaN(finalDate.getTime()) || cursor > finalDate) {
      return [];
    }
 
    const dailyStartTime = this.isoTimePart(startAt);
    const dailyEndTime   = this.isoTimePart(endAt);
 
    const slots: AvailabilitySlot[] = [];
    let daysProcessed = 0;
 
    while (cursor <= finalDate && daysProcessed < MAX_DATE_RANGE_DAYS) {
      const currentDateStr = this.toIsoDate(cursor);
 
      if (!this.isDateBlocked(currentDateStr, blackoutRanges)) {
        slots.push({
          date:      currentDateStr,
          startTime: dailyStartTime,
          endTime:   dailyEndTime,
        });
      }
 
      cursor.setDate(cursor.getDate() + 1);
      daysProcessed++;
    }
 
    return slots;
  }
 
  /**
   * RECURRING
   */
  private buildRecurringSlots(
    recurrence: { daysOfWeek: number[]; startTime?: string; endTime?: string },
    blackoutRanges: Array<{ startAt: string; endAt: string }>,
  ): AvailabilitySlot[] {
    if (!recurrence.daysOfWeek?.length) return [];
 
    const allowedDays = new Set(recurrence.daysOfWeek);
 
    
    const endTime =
      recurrence.endTime && recurrence.endTime !== EMPTY_END_TIME
        ? recurrence.endTime
        : null;
 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
 
    const slots: AvailabilitySlot[] = [];
 
    for (
      let offset = 0;
      offset <RECURRING_SEARCH_WINDOW_DAYS &&
      slots.length <MAX_RECURRING_RESULTS;
      offset++
    ) {
      const candidate = new Date(today);
      candidate.setDate(today.getDate() + offset);
 
      if (!allowedDays.has(candidate.getDay())) continue;
 
      const candidateDateStr = this.toIsoDate(candidate);
      if (this.isDateBlocked(candidateDateStr, blackoutRanges)) continue;
 
      slots.push({
        date:      candidateDateStr,
        startTime: recurrence.startTime ?? null,
        endTime,
      });
    }
 
    return slots;
  }


  private isoDatePart(isoString: string): string {
    return isoString.substring(0, 10);
  }
 

  private  isoTimePart(isoString: string): string {
    return isoString.substring(11, 16);
  }

  private localMidnight(dateStr: string): Date {
    return new Date(`${dateStr}T00:00:00`);
  }
 
  private toIsoDate(date: Date): string {
    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day   = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
 

  private  isDateBlocked(
    dateStr: string,
    blackoutRanges: Array<{ startAt: string; endAt: string }>,
  ): boolean {
    return blackoutRanges.some((range) => {
      const blockStart = this.isoDatePart(range.startAt);
      const blockEnd   = this.isoDatePart(range.endAt);
      return dateStr >= blockStart && dateStr <= blockEnd;
    });
  }
 
}