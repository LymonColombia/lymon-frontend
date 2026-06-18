import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { BreadcrumbComponent, BreadcrumbItem } from '@/presentation/shared/components/breadcrumb/breadcrumb.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapCalendar, bootstrapGeoAlt, bootstrapGeoAltFill, bootstrapPeopleFill, bootstrapSignpostSplit, bootstrapStar } from '@ng-icons/bootstrap-icons';
import { LocationMap } from '@/presentation/features/hotel/components/location-map/location-map';
import { GuestExperience } from '@/domain/entities/guest-experience.model';
import { AddCartExperienceItemUseCase } from '@/domain/use-cases/cart/add-cart-experience-item.use-case';


interface AvailabilitySlot {
  /** Fecha en formato ISO YYYY-MM-DD */
  date: string;
  /** Hora de inicio en formato HH:mm (24h), null si no aplica */
  startTime: string | null;
  /** Hora de fin en formato HH:mm (24h), null si no aplica */
  endTime: string | null;
}

/** Tope de seguridad para DATE_RANGE: evita generar miles de fechas si el rango es muy largo. */
const MAX_DATE_RANGE_DAYS = 20;
/** Tope de fechas a generar para experiencias RECURRING. */
const MAX_RECURRING_RESULTS = 12;
/** Ventana de búsqueda (en días hacia adelante) para experiencias RECURRING. */
const RECURRING_SEARCH_WINDOW_DAYS = 15;

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

  /** Fecha elegida por el usuario en el selector (formato ISO YYYY-MM-DD). */
  readonly selectedDate = signal<string | null>(null);

  /** Hora elegida por el usuario, si la experiencia tiene horarios (formato HH:mm). */
  readonly selectedTime = signal<string | null>(null);

  /** Cantidad de participantes elegida por el usuario. */
  readonly guestsCount = signal(1);

  /** Mensaje de feedback tras intentar reservar (éxito o error de validación). */
  readonly reservationMessage = signal<string | null>(null);


  /** Migas de pan: "Experiencias > Nombre de la experiencia". */
  readonly breadcrumbItems = computed<readonly BreadcrumbItem[]>(() => [
    { label: 'Experiencias', route: '/experiences' },
    { label: this.experience().name },
  ]);

  // ============================================================
  // DISPONIBILIDAD: FECHAS
  // ============================================================

  /**
   * Lista de slots disponibles (fecha + horario) según el tipo de
   * disponibilidad configurado en la experiencia. Es el cómputo central:
   * to do lo demás (opciones de fecha, opciones de hora, validaciones)
   * depende de esto.
   */
  readonly availableSlots = computed(() => this.buildAvailableSlots(this.experience()));

  /** Fechas únicas disponibles, derivadas de los slots (sin duplicar por hora). */
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

  /** Opciones para el <select> de fecha. */
  readonly availableDateOptions = computed<SelectOption[]>(() =>
    this.availableDates().map((date) => ({
      value: date,
      label: this.formatDate(date),
    })),
  );

  // ============================================================
  // DISPONIBILIDAD: HORARIOS (depende de la fecha elegida)
  // ============================================================

  /**
   * Horarios disponibles PARA LA FECHA SELECCIONADA.
   * Si la experiencia no maneja horarios (RECURRING sin startTime/endTime,
   * o ONE_TIME/DATE_RANGE de un solo bloque), devuelve un array vacío y
   * el selector de hora simplemente no se muestra.
   */
  readonly availableTimesForSelectedDate = computed(() => {
    const date = this.selectedDate();
    if (!date) {
      return [];
    }

    return this.availableSlots()
      .filter((slot) => slot.date === date && slot.startTime)
      .map((slot) => slot.startTime as string);
  });

  /** Opciones para el <select> de hora (solo relevante si hay horarios). */
  readonly availableTimeOptions = computed<SelectOption[]>(() =>
    this.availableTimesForSelectedDate().map((time) => ({
      value: time,
      label: time,
    })),
  );

  /** True si esta experiencia requiere elegir hora además de fecha. */
  readonly requiresTimeSelection = computed(() => this.availableTimeOptions().length > 0);

  // ============================================================
  // PARTICIPANTES
  // ============================================================

  /** Opciones para el <select> de cantidad de participantes (1..capacity). */
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

  // ============================================================
  // INFORMACIÓN GENERAL (panel de detalle)
  // ============================================================

  /** Filas de info general: categoría, duración, capacidad, precio. */
  readonly generalInfoItems = computed(() => {
    const experience = this.experience();
    return [
      { label: 'Categoria', value: this.getCategoryLabel(experience.category) },
      { label: 'Duracion', value: this.getDurationLabel(experience.durationHours) },
      { label: 'Capacidad', value: this.getCapacityLabel(experience.capacity) },
      { label: 'Precio', value: this.formatCurrency(experience.priceCop) },
    ];
  });

  // ============================================================
  // LABELS DERIVADOS PARA EL TEMPLATE
  // ============================================================

  readonly selectedDateLabel = computed(() => {
    const value = this.selectedDate();
    return value ? this.formatDate(value) : 'Sin seleccionar';
  });

  readonly selectedTimeLabel = computed(() => this.selectedTime() ?? 'Sin seleccionar');

  readonly priceLabel = computed(() => this.formatCurrency(this.experience().priceCop));
  readonly totalPrice = computed(() => this.experience().priceCop * this.guestsCount());
  readonly totalPriceLabel = computed(() => this.formatCurrency(this.totalPrice()));

  readonly locationPointLabel = computed(() => this.experience().location.label || 'Punto de encuentro');
  readonly locationAddressLabel = computed(
    () => this.experience().location.address || this.experience().location.label || 'Sin direccion disponible',
  );

  // ============================================================
  // CICLO DE VIDA
  // ============================================================

  constructor() {
    // Cada vez que cambia la experiencia (lo que dispara un nuevo cálculo
    // de availableSlots), reseteamos toda la selección del usuario para
    // que no queden fecha/hora/participantes de una experiencia anterior.
    effect(() => {
      const dates = this.availableDates();
      this.selectedDate.set(dates[0] ?? null);
      this.guestsCount.set(1);
      this.reservationMessage.set(null);
    });

    // Cuando cambia la fecha seleccionada, recalculamos la hora por defecto:
    // tomamos la primera hora disponible para esa fecha (si la experiencia
    // tiene horarios) o null si no aplica.
    effect(() => {
      const times = this.availableTimesForSelectedDate();
      this.selectedTime.set(times[0] ?? null);
    });
  }

  // ============================================================
  // HANDLERS DE EVENTOS DEL USUARIO
  // ============================================================

  onDateChange(value: string | number): void {
    // El SelectComponent es genérico y tipa su salida como string | number,
    // pero en este selector el valor SIEMPRE es un string ISO (YYYY-MM-DD).
    // Se normaliza por seguridad de tipos, no porque se espere recibir un number.
    this.selectedDate.set(String(value));
    this.reservationMessage.set(null);
  }

  onTimeChange(value: string | number): void {
    this.selectedTime.set(String(value));
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

    if (this.requiresTimeSelection() && !this.selectedTime()) {
      this.reservationMessage.set('Selecciona un horario disponible para continuar.');
      return;
    }

    const timeSuffix = this.selectedTime() ? ` a las ${this.selectedTime()}` : '';
    this.reservationMessage.set(
      `Reserva lista para ${this.guestsCount()} participante(s) el ${this.selectedDateLabel()}${timeSuffix}.`,
    );
  }

  // ============================================================
  // CONSTRUCCIÓN DE DISPONIBILIDAD (lógica privada)
  // ============================================================

  /**
   * Punto de entrada: según `availabilityType`, delega en el builder
   * correspondiente. Devuelve siempre un array de AvailabilitySlot,
   * que es la unidad atómica de "fecha + horario disponible".
   */
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

  /**
   * ONE_TIME: la experiencia ocurre una sola vez, en una ventana puntual
   * definida por startAt/endAt (ej. "17 jun 17:58 a 17 jun 21:58").
   * Genera UN solo slot: la fecha de startAt, con su hora de inicio y fin.
   */
  private buildOneTimeSlots(startAt: string | null, endAt: string | null): AvailabilitySlot[] {
    if (!startAt) {
      return [];
    }

    const start = new Date(startAt);
    if (Number.isNaN(start.getTime())) {
      return [];
    }

    const end = endAt ? new Date(endAt) : null;

    return [
      {
        date: this.toIsoDate(start),
        startTime: this.toHourMinute(start),
        endTime: end && !Number.isNaN(end.getTime()) ? this.toHourMinute(end) : null,
      },
    ];
  }

  /**
   * DATE_RANGE: la experiencia está disponible cada día dentro de un rango
   * (ej. del 19 al 30 de junio), excluyendo blackoutRanges.
   * La hora de inicio/fin se toma de startAt/endAt (la hora del día en que
   * "abre" la experiencia, igual todos los días del rango).
   *
   * IMPORTANTE: se limita a MAX_DATE_RANGE_DAYS días para evitar generar
   * miles de opciones si alguien configura un rango de meses/años por error.
   */
  private buildDateRangeSlots(
    startAt: string | null,
    endAt: string | null,
    blackoutRanges: Array<{ startAt: string; endAt: string }>,
  ): AvailabilitySlot[] {
    if (!startAt || !endAt) {
      return [];
    }

    const start = new Date(startAt);
    const end = new Date(endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return [];
    }

    // Hora de inicio/fin "del día": se repite igual para cada fecha del rango.
    const dailyStartTime = this.toHourMinute(start);
    const dailyEndTime = this.toHourMinute(end);

    const slots: AvailabilitySlot[] = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const finalDate = new Date(end);
    finalDate.setHours(0, 0, 0, 0);

    let daysProcessed = 0;
    while (cursor <= finalDate && daysProcessed < MAX_DATE_RANGE_DAYS) {
      if (!this.isDateBlocked(cursor, blackoutRanges)) {
        slots.push({
          date: this.toIsoDate(cursor),
          startTime: dailyStartTime,
          endTime: dailyEndTime,
        });
      }

      cursor.setDate(cursor.getDate() + 1);
      daysProcessed += 1;
    }

    return slots;
  }

  /**
   * RECURRING: la experiencia se repite en ciertos días de la semana
   * (ej. martes y miércoles), con un horario fijo definido en
   * recurrence.startTime / recurrence.endTime (ej. "11:01" a "00:01",
   * lo que indica que puede cruzar medianoche).
   *
   * Busca hacia adelante en una ventana de RECURRING_SEARCH_WINDOW_DAYS días,
   * tomando como máximo MAX_RECURRING_RESULTS fechas válidas.
   */
  private buildRecurringSlots(
    recurrence: { daysOfWeek: number[]; startTime?: string; endTime?: string },
    blackoutRanges: Array<{ startAt: string; endAt: string }>,
  ): AvailabilitySlot[] {
    if (!recurrence.daysOfWeek?.length) {
      return [];
    }

    const allowedDays = new Set(recurrence.daysOfWeek);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const slots: AvailabilitySlot[] = [];
    for (let offset = 0; offset < RECURRING_SEARCH_WINDOW_DAYS && slots.length < MAX_RECURRING_RESULTS; offset += 1) {
      const candidate = new Date(today);
      candidate.setDate(today.getDate() + offset);

      if (!allowedDays.has(candidate.getDay())) {
        continue;
      }

      if (this.isDateBlocked(candidate, blackoutRanges)) {
        continue;
      }

      slots.push({
        date: this.toIsoDate(candidate),
        startTime: recurrence.startTime ?? null,
        endTime: recurrence.endTime ?? null,
      });
    }

    return slots;
  }

  /**
   * Revisa si una fecha cae dentro de algún rango de blackoutRanges
   * (días en los que la experiencia NO está disponible, ej. mantenimiento,
   * vacaciones del host, etc.).
   */
  private isDateBlocked(date: Date, blackoutRanges: Array<{ startAt: string; endAt: string }>): boolean {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return blackoutRanges.some((range) => {
      const start = new Date(range.startAt);
      const end = new Date(range.endAt);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return false;
      }

      return start <= endOfDay && end >= startOfDay;
    });
  }

  // ============================================================
  // FORMATEO Y HELPERS PUROS
  // ============================================================

  /** Convierte un Date a string ISO de solo fecha: YYYY-MM-DD. */
  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Convierte un Date a string de hora local: HH:mm (24h). */
  private toHourMinute(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /** Formatea una fecha ISO a texto legible en español (ej. "19 jun. 2026"). */
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

  /** Formatea un monto en pesos colombianos sin decimales. */
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
    const normalized = category.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}