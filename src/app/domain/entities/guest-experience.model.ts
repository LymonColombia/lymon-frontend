export interface GuestExperience {
  id: string;
  name: string;
  description: string;
  category: string;
  priceCop: number;
  durationHours: number;
  capacity: number;
  coverImageUrl: string;
  location: { label: string; address: string };
  allowReservationPurchase: boolean;
}

export interface GuestExperiencePage {
  experiences: GuestExperience[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
