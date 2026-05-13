export interface CartItemDateRange {
  start: string;
  end?: string;
}

export interface CartItem {
description: any;
location: any;
  id: string;
  type: 'experience' | 'accommodation';
  title: string;
  price: number;
  quantity: number;
  dates?: CartItemDateRange;
  guests?: number;
  image: string;
}

export interface CartTotals {
  subtotal: number;
  taxes: number;
  total: number;
}

export interface RecommendationExperience {
  location: any;
  description: any;
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
