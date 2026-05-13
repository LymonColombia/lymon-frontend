export interface ExperienceCard {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  priceFrom: number;
  hostCertified: boolean;
  category: string;
  categories: readonly string[];
  location: string;
  ownerType: string;
  ownerName: string;
  rating: number;
  reviewCount: number;
  duration: string;
  maxGuests: number;
  latitude: number;
  longitude: number;
}


export interface ExperienceDetail extends ExperienceCard {
  readonly summary: string;
  readonly capacity: string;
  readonly includes: readonly string[];
}

export interface ExperienceReservationDraft {
  readonly experienceId: string;
  readonly date: string;
  readonly guests: number;
  readonly total: number;
}