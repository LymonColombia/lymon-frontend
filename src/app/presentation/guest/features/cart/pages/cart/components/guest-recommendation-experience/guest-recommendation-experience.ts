import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapCalendar,
  bootstrapClock,
  bootstrapGeoAlt,
  bootstrapInfoCircle,
  bootstrapPeopleFill,
  bootstrapPlusCircle,
  bootstrapStars,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { ExperienceCompactCardComponent } from '../experience-compact-card/experience-compact-card';
import { GetGuestExperiencesUseCase } from '@/domain/use-cases/experience/get-guest-experiences.use-case';
import { AddCartExperienceItemUseCase } from '@/domain/use-cases/cart/add-cart-experience-item.use-case';
import { GuestExperience } from '@/domain/entities/guest-experience.model';
import { buildAvailableSlots } from '@/presentation/shared/utils/experience-availability.util';
import { formatPrice } from '@/presentation/shared/utils/price-formatter';

const EXPERIENCES_PAGE_SIZE = 10;

@Component({
  selector: 'app-guest-recommendation-experience',
  standalone: true,
  imports: [ButtonComponent, ModalComponent, SelectComponent, NgIcon, ExperienceCompactCardComponent],
  providers: [
    provideIcons({
      bootstrapCalendar,
      bootstrapClock,
      bootstrapGeoAlt,
      bootstrapInfoCircle,
      bootstrapPeopleFill,
      bootstrapPlusCircle,
      bootstrapStars,
    }),
  ],
  templateUrl: './guest-recommendation-experience.html',
  styleUrl: './guest-recommendation-experience.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestRecommendationExperienceComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getExperiencesUseCase = inject(GetGuestExperiencesUseCase);
  private readonly addExperienceItemToCart = inject(AddCartExperienceItemUseCase);
  private requestedPropertyId: string | null = null;

  readonly propertyId = input<string | null>(null);
  readonly addedExperienceIds = input<string[]>([]);
  readonly added = output<void>();
  readonly experiencesAvailable = output<boolean>();

  readonly experiences = signal<GuestExperience[]>([]);
  readonly experiencesLoading = signal(false);
  readonly experiencesCurrentPage = signal(1);
  readonly experiencesTotalPages = signal(1);
  readonly hasMoreExperiences = computed(() => this.experiencesCurrentPage() < this.experiencesTotalPages());
  readonly showExplorerModal = signal(false);

  readonly selectedExperience = signal<GuestExperience | null>(null);
  readonly selectedDate = signal<string | null>(null);
  readonly guestsCount = signal(1);
  readonly isAdding = signal(false);
  readonly addError = signal<string | null>(null);

  readonly availableDateOptions = computed<SelectOption[]>(() => {
    const exp = this.selectedExperience();
    if (!exp) return [];
    return this.uniqueDatesFor(exp).map((date) => ({ value: date, label: this.formatDate(date) }));
  });

  readonly guestOptions = computed<SelectOption[]>(() => {
    const maxGuests = Math.max(1, this.selectedExperience()?.capacity ?? 1);
    return Array.from({ length: maxGuests }, (_, index) => {
      const total = index + 1;
      return { value: total, label: total === 1 ? '1 participante' : `${total} participantes` };
    });
  });

  readonly totalPriceLabel = computed(() => {
    const exp = this.selectedExperience();
    if (!exp) return '';
    return `$${formatPrice(exp.priceCop * this.guestsCount())}`;
  });

  protected readonly formatPrice = formatPrice;

  constructor() {
    effect(() => {
      const id = this.propertyId();
      if (id) {
        this.loadExperiences(id, 1);
      } else {
        this.requestedPropertyId = null;
        this.experiences.set([]);
        this.experiencesAvailable.emit(false);
      }
    });
  }

  isExperienceAdded(id: string): boolean {
    return this.addedExperienceIds().includes(id);
  }

  loadMoreExperiences(): void {
    const propertyId = this.propertyId();
    if (!propertyId) return;
    this.loadExperiences(propertyId, this.experiencesCurrentPage() + 1);
  }

  openExplorer(): void {
    this.showExplorerModal.set(true);
  }

  closeExplorer(): void {
    this.showExplorerModal.set(false);
  }

  selectExperience(exp: GuestExperience): void {
    this.showExplorerModal.set(false);
    this.selectedExperience.set(exp);
    this.selectedDate.set(this.uniqueDatesFor(exp)[0] ?? null);
    this.guestsCount.set(1);
    this.addError.set(null);
  }

  closeDetail(): void {
    if (this.isAdding()) return;
    this.selectedExperience.set(null);
    this.addError.set(null);
  }

  onDateChange(value: string | number): void {
    this.selectedDate.set(String(value));
  }

  onGuestChange(value: string | number): void {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue)) return;

    const maxGuests = Math.max(1, this.selectedExperience()?.capacity ?? 1);
    this.guestsCount.set(Math.max(1, Math.min(nextValue, maxGuests)));
  }

  confirmAdd(): void {
    const exp = this.selectedExperience();
    const date = this.selectedDate();
    if (!exp || !date) {
      this.addError.set('Selecciona una fecha disponible para continuar.');
      return;
    }

    const tenantId = exp.tenantId;
    if (!tenantId) {
      this.addError.set('Inténtalo de nuevo más tarde.');
      return;
    }

    this.isAdding.set(true);
    this.addError.set(null);

    this.addExperienceItemToCart
      .execute({
        tenantId,
        experienceId: exp.id,
        quantity: this.guestsCount(),
        selectedDate: date,
        reservationId: null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isAdding.set(false);
          this.selectedExperience.set(null);
          this.added.emit();
        },
        error: () => {
          this.isAdding.set(false);
          this.addError.set('No se pudo agregar la experiencia al carrito.');
        },
      });
  }

  formatCategory(category: string): string {
    const CATEGORY_LABELS: Record<string, string> = {
      TRANSPORTATION: 'Transporte',
      TOUR: 'Tour',
      WELLNESS: 'Bienestar',
      FOOD: 'Gastronomía',
      ADVENTURE: 'Aventura',
      TRANSPORTE: 'Transporte',
      BIENESTAR: 'Bienestar',
    };
    return CATEGORY_LABELS[category] ?? category;
  }

  private uniqueDatesFor(exp: GuestExperience): string[] {
    const seen = new Set<string>();
    const dates: string[] = [];
    for (const slot of buildAvailableSlots(exp)) {
      if (!seen.has(slot.date)) {
        seen.add(slot.date);
        dates.push(slot.date);
      }
    }
    return dates;
  }

  private formatDate(value: string): string {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed);
  }

  private loadExperiences(propertyId: string, page: number): void {
    this.requestedPropertyId = propertyId;
    this.experiencesLoading.set(true);
    this.getExperiencesUseCase
      .execute({ propertyId, page, limit: EXPERIENCES_PAGE_SIZE })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (propertyId !== this.requestedPropertyId) return;
          const incoming = result.experiences;
          this.experiences.set(page === 1 ? incoming : [...this.experiences(), ...incoming]);
          this.experiencesCurrentPage.set(result.page);
          this.experiencesTotalPages.set(result.totalPages);
          this.experiencesLoading.set(false);
          this.experiencesAvailable.emit(this.experiences().length > 0);
        },
        error: () => {
          if (propertyId !== this.requestedPropertyId) return;
          this.experiencesLoading.set(false);
        },
      });
  }
}
