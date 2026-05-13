import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapBag, bootstrapChevronLeft } from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { CheckoutPanelComponent } from './components/checkout-panel/checkout-panel';
import { GuestRecommendationExperienceComponent } from './components/guest-recommendation-experience/guest-recommendation-experience';
import { OrderSummaryComponent } from './components/order-summary/order-summary';
import {
  CartItem,
  CartTotals,
  RecommendationExperience,
} from './guest-cart.models';

const TAX_RATE = 0.1;
const STORAGE_KEY = 'guest-cart-state-v1';
const STORAGE_SELECTION_KEY = 'guest-cart-selected-item-v1';

const DEFAULT_CART_ITEMS: CartItem[] = [
  {
    id: 'acc-001',
    type: 'accommodation',
    title: 'Suite Premium Ocean View',
    price: 560000,
    quantity: 1,
    dates: { start: '2026-06-14', end: '2026-06-17' },
    guests: 2,
    image: '/images/suite2.avif',
    description: 'Enjoy a romantic sunset cruise along the coast, complete with drinks and light snacks.',
    location: 'Marina Bay, 5km from hotel'
  },
  {
    id: 'exp-101',
    type: 'experience',
    title: 'Sunset Catamaran Tour',
    price: 240000,
    quantity: 2,
    dates: { start: '2026-06-15' },
    guests: 2,
    image: '/images/suite2.avif',
    description: 'Enjoy a romantic sunset cruise along the coast, complete with drinks and light snacks.',
    location: 'Marina Bay, 5km from hotel'
  },
  {
    id: 'exp-204',
    type: 'experience',
    title: 'Coffee & Chocolate Masterclass',
    price: 180000,
    quantity: 1,
    dates: { start: '2026-06-16' },
    guests: 2,
    image: '/images/suite2.avif',
    description: 'Discover the secrets of local coffee and chocolate with expert guides, including tastings and hands-on activities.',
    location: 'medeliin'
  },
];

@Component({
  selector: 'app-guest-cart',
  standalone: true,
  imports: [
    ButtonComponent,
    CheckoutPanelComponent,
    FooterComponent,
    GuestRecommendationExperienceComponent,
    NgIcon,
    OrderSummaryComponent,
  ],
  providers: [provideIcons({ bootstrapBag, bootstrapChevronLeft })],
  templateUrl: './guest-cart.html',
  styleUrl: './guest-cart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestCartPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly cartItems = signal<CartItem[]>(DEFAULT_CART_ITEMS);
  readonly selectedItemId = signal<string | null>(DEFAULT_CART_ITEMS[0]?.id ?? null);
  readonly isSubmitting = signal(false);


  readonly selectedItem = computed(() => {
    const selectedId = this.selectedItemId();
    if (!selectedId) return null;
    return this.cartItems().find((item) => item.id === selectedId) ?? null;
  });

  readonly totals = computed<CartTotals>(() => {
    const subtotal = this.cartItems().reduce((acc, item) => acc + item.price * item.quantity, 0);
    const taxes = Math.round(subtotal * TAX_RATE);
    const total = subtotal + taxes;
    return { subtotal, taxes, total };
  });

  readonly isEmpty = computed(() => this.cartItems().length === 0);

  ngOnInit(): void {
    this.restoreCartFromStorage();
    this.syncSelectedItem();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  goBack(): void {
    void this.router.navigate(['/booking']);
  }

  goToBooking(): void {
    void this.router.navigate(['/booking']);
  }

  onSelectItem(itemId: string): void {
    this.selectedItemId.set(itemId);
    this.persistSelection(itemId);
  }

  onQuantityChange(payload: { itemId: string; delta: number }): void {
    const next = this.cartItems()
      .map((item) => {
        if (item.id !== payload.itemId) return item;
        return { ...item, quantity: item.quantity + payload.delta };
      })
      .filter((item) => item.quantity > 0);

    this.cartItems.set(next);
    this.syncSelectedItem();
    this.persistCart();
  }

  onRemoveItem(itemId: string): void {
    const next = this.cartItems().filter((item) => item.id !== itemId);
    this.cartItems.set(next);
    this.syncSelectedItem();
    this.persistCart();
  }

  onAddRecommendation(item: RecommendationExperience): void {
    const next = [...this.cartItems()];
    const existingIndex = next.findIndex((current) => current.id === item.id);

    if (existingIndex >= 0) {
      const existing = next[existingIndex];
      next[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
    } else {
      next.push({
        id: item.id,
        type: 'experience',
        title: item.title,
        price: item.price,
        quantity: 1,
        dates: item.dates,
        guests: item.guests ?? 1,
        image: item.image,
        description: item.description,
        location: item.location
      });
    }

    this.cartItems.set(next);
    this.selectedItemId.set(item.id);
    this.persistCart();
    this.persistSelection(item.id);
  }

  private syncSelectedItem(): void {
    const items = this.cartItems();
    if (!items.length) {
      this.selectedItemId.set(null);
      this.persistSelection(null);
      return;
    }

    const currentSelected = this.selectedItemId();
    const exists = !!items.find((item) => item.id === currentSelected);
    if (!exists) {
      this.selectedItemId.set(items[0].id);
      this.persistSelection(items[0].id);
    }
  }


  private persistCart(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cartItems()));
    } catch {
      // ignore storage issues silently
    }
  }

  private persistSelection(itemId: string | null): void {
    try {
      if (!itemId) {
        localStorage.removeItem(STORAGE_SELECTION_KEY);
        return;
      }
      localStorage.setItem(STORAGE_SELECTION_KEY, itemId);
    } catch {
      // ignore storage issues silently
    }
  }

  private restoreCartFromStorage(): void {
    try {
      const storedCart = localStorage.getItem(STORAGE_KEY);
      const storedSelection = localStorage.getItem(STORAGE_SELECTION_KEY);
      if (!storedCart) return;

      const parsed = JSON.parse(storedCart) as CartItem[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return;
      }

      const sanitized = parsed.filter((item) =>
        item
        && typeof item.id === 'string'
        && (item.type === 'experience' || item.type === 'accommodation')
        && typeof item.title === 'string'
        && typeof item.price === 'number'
        && typeof item.quantity === 'number'
        && typeof item.image === 'string',
      );

      if (!sanitized.length) {
        return;
      }

      this.cartItems.set(sanitized);
      if (storedSelection) {
        this.selectedItemId.set(storedSelection);
      }
    } catch {
      // ignore parse/storage issues silently
    }
  }
}
