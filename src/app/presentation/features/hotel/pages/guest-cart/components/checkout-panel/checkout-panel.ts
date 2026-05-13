import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapCalendar,
  bootstrapCalendarEvent,
  bootstrapCheckCircle,
  bootstrapDashCircle,
  bootstrapGeoAltFill,
  bootstrapPeopleFill,
  bootstrapPlusCircle,
  bootstrapShieldLock,
  bootstrapTrash,

} from '@ng-icons/bootstrap-icons';
import {
  CartItem,
} from '../../guest-cart.models';

interface FieldChangeEvent {
  field: string;
  value: string;
}

@Component({
  selector: 'app-checkout-panel',
  standalone: true,
  imports: [NgIcon],
  providers: [
    provideIcons({
      bootstrapCalendar,
      bootstrapCalendarEvent,
      bootstrapCheckCircle,
      bootstrapDashCircle,
      bootstrapPeopleFill,
      bootstrapPlusCircle,
      bootstrapShieldLock,
      bootstrapTrash,
      bootstrapGeoAltFill
    }),
  ],
  templateUrl: './checkout-panel.html',
  styleUrl: './checkout-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPanelComponent {
  readonly selectedItem = input.required<CartItem | null>();
  readonly cartItems = input.required<CartItem[]>();
  readonly isSubmitting = input(false);

  readonly quantityChange = output<{ itemId: string; delta: number }>();
  readonly removeItem = output<string>();

  onQuantityDelta(itemId: string, delta: number): void {
    this.quantityChange.emit({ itemId, delta });
  }

  onRemove(itemId: string): void {
    this.removeItem.emit(itemId);
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  formatDate(dateValue?: string): string {
    if (!dateValue) return '-';
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
