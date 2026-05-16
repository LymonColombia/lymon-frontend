import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowRight,
  bootstrapCalendar,
  bootstrapCheckCircle,
  bootstrapCheckCircleFill,
  bootstrapChevronLeft,
  bootstrapClock,
  bootstrapCreditCard,
  bootstrapDashCircle,
  bootstrapExclamationTriangle,
  bootstrapGeoAlt,
  bootstrapInfoCircle,
  bootstrapPeopleFill,
  bootstrapPlusCircle,
  bootstrapStars,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { CreateGuestReservationUseCase } from '@/domain/use-cases/reservation/create-guest-reservation.use-case';
import { GetGuestExperiencesUseCase } from '@/domain/use-cases/experience/get-guest-experiences.use-case';
import { GuestExperience } from '@/domain/entities/guest-experience.model';
import { ExperienceCompactCardComponent } from './components/experience-compact-card/experience-compact-card.component';

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
  imports: [ButtonComponent, FormsModule, NgIcon, ExperienceCompactCardComponent, ModalComponent],
  providers: [provideIcons({
    bootstrapArrowRight,
    bootstrapCalendar,
    bootstrapCheckCircle,
    bootstrapCheckCircleFill,
    bootstrapChevronLeft,
    bootstrapClock,
    bootstrapCreditCard,
    bootstrapDashCircle,
    bootstrapExclamationTriangle,
    bootstrapGeoAlt,
    bootstrapInfoCircle,
    bootstrapPeopleFill,
    bootstrapPlusCircle,
    bootstrapStars,
  })],
  templateUrl: './guest-checkout.html',
  styleUrl: './guest-checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestCheckoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly createReservationUseCase = inject(CreateGuestReservationUseCase);
  private readonly getExperiencesUseCase = inject(GetGuestExperiencesUseCase);

  readonly info = signal<CheckoutState | null>(null);
  readonly isLoading = signal(false);
  readonly isSuccess = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly notes = signal('');

  readonly addedExperiences = signal<GuestExperience[]>([]);
  readonly selectedExperience = signal<GuestExperience | null>(null);
  readonly showExplorerModal = signal(false);

  readonly experiences = signal<GuestExperience[]>([]);
  readonly experiencesLoading = signal(false);
  readonly experiencesCurrentPage = signal(1);
  readonly experiencesTotalPages = signal(1);
  readonly hasMoreExperiences = computed(() => this.experiencesCurrentPage() < this.experiencesTotalPages());

  readonly grandTotal = computed(() => {
    const info = this.info();
    if (!info) return 0;
    return info.total + this.addedExperiences().reduce((sum, exp) => sum + exp.priceCop, 0);
  });

  ngOnInit(): void {
    const state = history.state as Partial<CheckoutState>;
    if (state?.unitId && state?.checkIn && state?.checkOut) {
      this.info.set(state as CheckoutState);
      if (state.propertyId) {
        this.loadExperiences(state.propertyId, 1);
      }
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

  goToReservations(): void {
    this.router.navigate(['/guest/reservations']);
  }

  goToExperiences(): void {
    this.router.navigate(['/experiences']);
  }

  formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  selectExperience(exp: GuestExperience): void {
    this.selectedExperience.set(exp);
  }

  closeExperienceDetail(): void {
    this.selectedExperience.set(null);
  }

  toggleAndClose(exp: GuestExperience): void {
    const current = this.addedExperiences();
    const exists = current.some(e => e.id === exp.id);
    if (exists) {
      this.addedExperiences.set(current.filter(e => e.id !== exp.id));
    } else {
      this.addedExperiences.set([...current, exp]);
    }
    this.closeExperienceDetail();
  }

  isExperienceAdded(id: string): boolean {
    return this.addedExperiences().some(e => e.id === id);
  }

  removeExperience(id: string): void {
    this.addedExperiences.set(this.addedExperiences().filter(e => e.id !== id));
  }

  openExplorer(): void {
    this.showExplorerModal.set(true);
  }

  closeExplorer(): void {
    this.showExplorerModal.set(false);
  }

  loadMoreExperiences(): void {
    const propertyId = this.info()?.propertyId;
    if (!propertyId) return;
    this.loadExperiences(propertyId, this.experiencesCurrentPage() + 1);
  }

  private loadExperiences(propertyId: string, page: number): void {
    this.experiencesLoading.set(true);
    this.getExperiencesUseCase.execute({ propertyId, page, limit: 10 }).subscribe({
      next: (result) => {
        const incoming = result.experiences;
        this.experiences.set(page === 1 ? incoming : [...this.experiences(), ...incoming]);
        this.experiencesCurrentPage.set(result.page);
        this.experiencesTotalPages.set(result.totalPages);
        this.experiencesLoading.set(false);
      },
      error: () => {
        this.experiencesLoading.set(false);
      },
    });
  }

  selectExperienceFromExplorer(exp: GuestExperience): void {
    this.showExplorerModal.set(false);
    this.selectedExperience.set(exp);
  }

  formatExpPrice(price: number): string {
    return price.toLocaleString('es-CO');
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
}
