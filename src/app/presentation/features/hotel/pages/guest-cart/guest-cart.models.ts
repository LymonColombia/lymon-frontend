import type {
  Cart,
  CartExperienceItem,
  CartReservationDraftRequest,
  CartReservationItem,
} from '@/domain/entities/cart.model';

export type {
  Cart,
  CartExperienceItem,
  CartReservationDraftRequest,
  CartReservationItem,
};

export interface CartItemDateRange {
  start: string;
  end?: string;
}

export type GuestCartEntryKind = 'reservation' | 'experience';

export interface GuestCartDetail {
  label: string;
  value: string;
}

export interface GuestCartSummaryItem {
  id: string;
  kind: GuestCartEntryKind;
  title: string;
  subtitle: string;
  totalPriceCop: number;
  quantityLabel: string;
  details: GuestCartDetail[];
  canRemove?: boolean;
}

export interface GuestCartTotals {
  subtotalCop: number;
  totalCop: number;
}

export interface RecommendationExperience {
  location: string;
  description: string;
  id: string;
  title: string;
  price: number;
  image: string;
  rating?: number;
  duration?: string;
  dates?: CartItemDateRange;
  guests?: number;
}

export interface GuestInfoForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface PaymentForm {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
}
