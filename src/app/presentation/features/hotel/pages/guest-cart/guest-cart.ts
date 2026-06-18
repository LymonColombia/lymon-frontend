import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapBag, bootstrapChevronLeft } from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { CheckoutPanelComponent } from './components/checkout-panel/checkout-panel';
import { OrderSummaryComponent } from './components/order-summary/order-summary';
import { GetCartUseCase } from '@/domain/use-cases/cart/get-cart.use-case';
import { Cart } from '@/domain/entities/cart.model';

@Component({
  selector: 'app-guest-cart',
  standalone: true,
  imports: [
    ButtonComponent,
    CheckoutPanelComponent,
    FooterComponent,
    NgIcon,
    OrderSummaryComponent,
  ],
  providers: [provideIcons({ bootstrapBag, bootstrapChevronLeft })],
  templateUrl: './guest-cart.html',
  styleUrl: './guest-cart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestCartPage implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly getCartUseCase = inject(GetCartUseCase);

  readonly cart = signal<Cart | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedItemKey = signal<string | null>(null);

 
  readonly isEmpty = computed(() => {
    const cart = this.cart();
    if (!cart) return false;
    return !cart.reservationItem && cart.experienceItems.length === 0;
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

  goToCheckout(): void {
    void this.router.navigate(['/guest/checkout']);
  }

  onSelectItem(itemKey: string): void {
    this.selectedItemKey.set(itemKey);
  }

  onRemoveItem(_itemKey: string): void {
    return;
  }

  private loadCart(): void {
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
        },
        error: () => {
          this.cart.set(null);
          this.isLoading.set(false);
          this.errorMessage.set('Intenta de nuevo.');
        },
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

}
