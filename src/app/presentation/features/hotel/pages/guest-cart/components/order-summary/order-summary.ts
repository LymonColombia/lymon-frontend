import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapBagCheck, bootstrapBuilding, bootstrapStars, bootstrapTrash } from '@ng-icons/bootstrap-icons';
import { CartItem, CartTotals } from '../../guest-cart.models';
import { ButtonComponent } from "@/presentation/shared/components/button/button.component";

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [NgIcon, ButtonComponent],
  providers: [provideIcons({ bootstrapBagCheck, bootstrapBuilding, bootstrapStars, bootstrapTrash })],
  templateUrl: './order-summary.html',
  styleUrl: './order-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSummaryComponent {
  readonly cartItems = input.required<CartItem[]>();
  readonly selectedItemId = input<string | null>(null);
  readonly totals = input.required<CartTotals>();

  readonly selectItem = output<string>();
  readonly removeItem = output<string>();

  onSelectItem(itemId: string): void {
    this.selectItem.emit(itemId);
  }

  onRemoveItem(itemId: string): void {
    this.removeItem.emit(itemId);
  }

  typeLabel(type: CartItem['type']): string {
    return type === 'experience' ? 'Experience' : 'Accommodation';
  }

  itemTypeIcon(type: CartItem['type']): string {
    return type === 'experience' ? 'bootstrapStars' : 'bootstrapBuilding';
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }
}
