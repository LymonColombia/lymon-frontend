import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBagCheck,
  bootstrapCalendar,
  bootstrapCalendarEvent,
  bootstrapGeoAltFill,
  bootstrapPeopleFill,
  bootstrapShieldLock,
  bootstrapStars,
} from '@ng-icons/bootstrap-icons';
import { Cart, CartExperienceItem, CartReservationItem } from '@/domain/entities/cart.model';

type SelectedItem = CartReservationItem | CartExperienceItem | null;

@Component({
  selector: 'app-checkout-panel',
  standalone: true,
  imports: [NgIcon],
  providers: [
    provideIcons({
      bootstrapBagCheck,
      bootstrapCalendar,
      bootstrapCalendarEvent,
      bootstrapGeoAltFill,
      bootstrapPeopleFill,
      bootstrapShieldLock,
      bootstrapStars,
    }),
  ],
  templateUrl: './checkout-panel.html',
  styleUrl: './checkout-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPanelComponent {

 
  readonly cart            = input<Cart | null>(null);
  readonly selectedItemKey = input<string | null>(null);
  readonly isSubmitting    = input(false);

  readonly selectedItem = computed<SelectedItem>(() => {
    const cart = this.cart();
    if (!cart) return null;

    const key = this.selectedItemKey();

    if (key === 'reservation') return cart.reservationItem ?? null;

    if (key?.startsWith('experience:')) {
      const index = Number(key.split(':')[1]);
      if (!Number.isNaN(index)) return cart.experienceItems[index] ?? null;
    }

    return cart.reservationItem ?? cart.experienceItems[0] ?? null;
  });

  isReservation(item: SelectedItem): item is CartReservationItem {
    return !!item && 'checkIn' in item;
  }

  isExperience(item: SelectedItem): item is CartExperienceItem {
    return !!item && 'selectedDate' in item;
  }

  formatCurrency(value: number): string {
    return (value ?? 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  }

  formatDate(dateValue?: string): string {
    if (!dateValue) return '-';
    // Tomar solo la parte de fecha — el backend envía ISO con tiempo (T00:00:00.000Z)
    const [y, m, d] = dateValue.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  guestsLabel(count: number): string {
    return `${count} huésped${count === 1 ? '' : 'es'}`;
  }

  participantsLabel(count: number): string {
    return `${count} participante${count === 1 ? '' : 's'}`;
  }
}