import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '@/presentation/shared/components/breadcrumb/breadcrumb.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapCalendar, bootstrapGeoAlt, bootstrapGeoAltFill, bootstrapPeopleFill, bootstrapSignpostSplit, bootstrapStar } from '@ng-icons/bootstrap-icons';
import { LocationMap } from '@/presentation/features/hotel/components/location-map/location-map';
import { Cart } from '@/domain/entities/cart.model';
import { GuestExperience } from '@/domain/entities/guest-experience.model';
import { AddCartExperienceItemUseCase } from '@/domain/use-cases/cart/add-cart-experience-item.use-case';
import { buildAvailableSlots } from '@/presentation/shared/utils/experience-availability.util';
import { coverImageOf } from '@/presentation/shared/utils/media.util';

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
  templateUrl: './experience-detail.html',
  styleUrl: './experience-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceDetailComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly experience = input.required<GuestExperience>();

  readonly addExperienceItemToCart = inject(AddCartExperienceItemUseCase);

  readonly selectedDate = signal<string | null>(null);
  readonly guestsCount = signal(1);
  readonly reservationMessage = signal<string | null>(null);
  readonly isReserving = signal(false);

  readonly breadcrumbItems = computed<readonly BreadcrumbItem[]>(() => [
    { label: 'Experiencias', route: '/experiences' },
    { label: this.experience().name },
  ]);

  // Cover is mediaUrls[0] (placeholder when empty); the rest is the gallery.
  readonly coverImageUrl = computed(() => coverImageOf(this.experience().mediaUrls));
  readonly galleryUrls = computed(() => this.experience().mediaUrls.slice(1));

  readonly availableSlots = computed(() => buildAvailableSlots(this.experience()));

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
    const selectedDate = this.selectedDate();
    if (!selectedDate) {
      this.reservationMessage.set('Selecciona una fecha disponible para continuar.');
      return;
    }

    const tenantId = this.experience().tenantId;
    if (!tenantId) {
      this.reservationMessage.set('Intentalo de nuevo mas tarde');
      return;
    }

    this.isReserving.set(true);
    this.reservationMessage.set(null);

    this.addExperienceItemToCart
      .execute({
        tenantId,
        experienceId: this.experience().id,
        quantity: this.guestsCount(),
        selectedDate,
        reservationId: null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (_cart: Cart) => {
          this.isReserving.set(false);
          this.router.navigate(['/guest/cart']);
        },
        error: () => {
          this.isReserving.set(false);
          this.reservationMessage.set('No se pudo agregar la experiencia al carrito.');
        },
      });
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

}
