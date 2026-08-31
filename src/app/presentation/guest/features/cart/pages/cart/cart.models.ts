export type {
  Cart,
  CartExperienceItem,
  CartReservationDraftRequest,
  CartReservationItem,
} from '@/domain/guest/guest-cart/cart.model';

export type GuestCartEntryKind = 'reservation' | 'experience';

export interface GuestCartDetail {
  label: string;
  value: string;
}


