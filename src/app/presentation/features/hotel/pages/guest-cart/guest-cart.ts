import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBag,
  bootstrapCalendar,
  bootstrapCheckCircleFill,
  bootstrapChevronLeft,
  bootstrapExclamationTriangleFill,
  bootstrapPeopleFill,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { CheckoutPanelComponent } from './components/checkout-panel/checkout-panel';
import { OrderSummaryComponent } from './components/order-summary/order-summary';
import { PaymentPanelComponent } from './components/payment-panel/payment-panel';
import { GuestRecommendationExperienceComponent } from './components/guest-recommendation-experience/guest-recommendation-experience';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { DeleteCartExperienceItemUseCase } from '@/domain/use-cases/cart/delete-cart-experience-item.use-case';
import { GetCartUseCase } from '@/domain/use-cases/cart/get-cart.use-case';
import { GetPublicUnitUseCase } from '@/domain/use-cases/property/get-public-unit.use-case';
import { Cart } from '@/domain/entities/cart.model';

@Component({
  selector: 'app-guest-cart',
  standalone: true,
  imports: [
    ButtonComponent,
    CheckoutPanelComponent,
    FooterComponent,
    GuestRecommendationExperienceComponent,
    ModalComponent,
    NgIcon,
    OrderSummaryComponent,
    PaymentPanelComponent,
  ],
  providers: [provideIcons({
    bootstrapBag,
    bootstrapCalendar,
    bootstrapCheckCircleFill,
    bootstrapChevronLeft,
    bootstrapExclamationTriangleFill,
    bootstrapPeopleFill,
  })],
  templateUrl: './guest-cart.html',
  styleUrl: './guest-cart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestCartPage implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly deleteCartExperienceItemUseCase = inject(DeleteCartExperienceItemUseCase);
  private readonly getCartUseCase = inject(GetCartUseCase);
  private readonly getPublicUnitUseCase = inject(GetPublicUnitUseCase);

  readonly cart = signal<Cart | null>(null);
  readonly resolvedUnitName = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedItemKey = signal<string | null>(null);
  readonly isPaymentSuccess = signal(false);

  readonly experienceToDeleteIndex = signal<number | null>(null);
  readonly deleteExperienceErrorMessage = signal<string | null>(null);
  readonly isDeletingExperience = signal(false);
  readonly hasSuggestedExperiences = signal(false);

  readonly isEmpty = computed(() => {
    const cart = this.cart();
    if (!cart) return false;
    return !cart.reservationItem && cart.experienceItems.length === 0;
  });

  readonly experienceToDelete = computed(() => {
    const index = this.experienceToDeleteIndex();
    if (index === null) return null;
    return this.cart()?.experienceItems[index] ?? null;
  });

  readonly addedExperienceIds = computed(() => this.cart()?.experienceItems.map((item) => item.experienceId) ?? []);

  readonly displayCart = computed<Cart | null>(() => {
    const cart = this.cart();
    const resolvedName = this.resolvedUnitName();
    if (!cart?.reservationItem || !resolvedName) return cart;
    return {
      ...cart,
      reservationItem: { ...cart.reservationItem, unitName: resolvedName },
    };
  });

  ngOnInit(): void {
    this.loadCart();
  }

  goBack(): void {
    void this.router.navigate(['/booking']);
  }

  goToBooking(): void {
    void this.router.navigate(['/booking']);
  }

  goToReservations(): void {
    void this.router.navigate(['/guest/reservations']);
  }

  scrollToPayment(): void {
    document.getElementById('payment-panel-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollToRecommendations(): void {
    document.getElementById('recommendations-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onPaymentSucceeded(): void {
    this.isPaymentSuccess.set(true);
  }

  onSelectItem(itemKey: string): void {
    this.selectedItemKey.set(itemKey);
  }

  onRemoveExperience(index: number): void {
    const cart = this.cart();
    const experience = cart?.experienceItems[index];
    if (!experience) {
      return;
    }

    this.experienceToDeleteIndex.set(index);
    this.deleteExperienceErrorMessage.set(null);
  }

  closeDeleteExperienceModal(): void {
    if (this.isDeletingExperience()) {
      return;
    }

    this.experienceToDeleteIndex.set(null);
    this.deleteExperienceErrorMessage.set(null);
  }

  confirmDeleteExperience(): void {
    const cart = this.cart();
    const index = this.experienceToDeleteIndex();
    const experience = cart?.experienceItems[index ?? -1];

    if (!experience) {
      this.closeDeleteExperienceModal();
      return;
    }

    this.isDeletingExperience.set(true);
    this.deleteExperienceErrorMessage.set(null);

    this.deleteCartExperienceItemUseCase
      .execute(experience.experienceId, experience.selectedDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeletingExperience.set(false);
          this.experienceToDeleteIndex.set(null);
          this.loadCart();
        },
        error: (error) => {
          this.isDeletingExperience.set(false);
          this.deleteExperienceErrorMessage.set(error);
        },
      });
  }

  loadCart(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.getCartUseCase
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cart) => {
          this.cart.set(cart);
          this.isLoading.set(false);
          this.syncSelectedItem();
          this.resolveUnitName(cart?.reservationItem?.unitId ?? null);
        },
        error: () => {
          this.cart.set(null);
          this.isLoading.set(false);
          this.errorMessage.set('Intenta de nuevo.');
        },
      });
  }

  private resolveUnitName(unitId: string | null): void {
    if (!unitId) {
      this.resolvedUnitName.set(null);
      return;
    }

    this.getPublicUnitUseCase.execute(unitId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (unit) => this.resolvedUnitName.set(unit.name),
      error: () => this.resolvedUnitName.set(null),
    });
  }

  private syncSelectedItem(): void {
    const cart = this.cart();
    if (!cart) {
      this.selectedItemKey.set(null);
      return;
    }

    if (cart.reservationItem) {
      this.selectedItemKey.set('reservation');
      return;
    }

    if (cart.experienceItems.length > 0) {
      this.selectedItemKey.set('experience:0');
      return;
    }

    this.selectedItemKey.set(null);
  }

  private parseDatePart(dateStr: string): Date | null {
    if (!dateStr) return null;
    const clean = dateStr.split('T')[0];
    const [year, month, day] = clean.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month - 1, day);
  }

  formatDate(dateStr: string): string {
    const date = this.parseDatePart(dateStr);
    if (!date) return dateStr;
    return date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
}
