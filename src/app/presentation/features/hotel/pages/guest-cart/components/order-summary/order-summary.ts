import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapBagCheck, bootstrapX } from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { Cart, CartExperienceItem, CartReservationItem } from '@/domain/entities/cart.model';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [NgIcon, ButtonComponent],
  providers: [provideIcons({ bootstrapBagCheck, bootstrapX })],
  templateUrl: './order-summary.html',
  styleUrl: './order-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSummaryComponent {
  readonly cart = input<Cart | null>(null);
  readonly selectedItemKey = input<string | null>(null);

  readonly selectItem = output<string>();
  readonly removeExperience = output<number>();
  readonly proceedToCheckout = output<void>();

  readonly reservationKey = computed(() => 'reservation');

  onSelectReservation(): void {
    this.selectItem.emit(this.reservationKey());
  }

  onSelectExperience(index: number): void {
    this.selectItem.emit(this.experienceKey(index));
  }

  onRemoveExperience(index: number): void {
    this.removeExperience.emit(index);
  }

  onProceedToCheckout(): void {
    this.proceedToCheckout.emit();
  }

  isReservationSelected(): boolean {
    return this.selectedItemKey() === this.reservationKey();
  }

  isExperienceSelected(index: number): boolean {
    return this.selectedItemKey() === this.experienceKey(index);
  }

  experienceKey(index: number): string {
    return `experience:${index}`;
  }

  formatCurrency(value: number): string {
    return (value ?? 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  }

  reservationTitle(item: CartReservationItem): string {
    return item.unitName ?? item.unitId;
  }

  experienceTitle(item: CartExperienceItem, index: number): string {
    return item.experienceName ?? `Experiencia ${index + 1}`;
  }


  totalItems(): number {
    const cart = this.cart();
    if (!cart) return 0;
    return (cart.reservationItem ? 1 : 0) + cart.experienceItems.length;
  }
}
