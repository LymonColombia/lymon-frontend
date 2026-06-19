export type {
  Cart,
  CartExperienceItem,
  CartReservationDraftRequest,
  CartReservationItem,
} from '@/domain/entities/cart.model';

export type GuestCartEntryKind = 'reservation' | 'experience';

export interface GuestCartDetail {
  label: string;
  value: string;
}


