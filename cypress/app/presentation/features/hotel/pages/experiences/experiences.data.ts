interface ExperienceDetail {
  readonly id: string;
  readonly imageUrl: string;
  readonly title: string;
  readonly description: string;
  readonly summary: string;
  readonly category: string;
  readonly categories: readonly string[];
  readonly location: string;
  readonly priceFrom: number;
  readonly hostCertified: boolean;
  readonly rating: number;
  readonly reviewCount: number;
  readonly duration: string;
  readonly capacity: string;
  readonly maxGuests: number;
  readonly ownerName: string;
  readonly ownerType: string;
  readonly includes: readonly string[];
  readonly latitude: number;
  readonly longitude: number;
}

export const EXPERIENCE_CATALOG:  ExperienceDetail[] = [
  {
    id: 'exp-1',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop',
    title: 'Parapente sobre el canon del Chicamocha',
    description:
      'Vuela sobre el canon del Chicamocha y disfruta una vista panoramica inolvidable con pilotos certificados.',
    summary:
      'Experiencia aerea para amantes de la adrenalina con briefing de seguridad, vuelo tandem y registro fotografico opcional.',
    category: 'Aventura',
    categories: ['Aventura', 'Naturaleza', 'Panoramico'],
    location: 'San Gil, Santander',
    priceFrom: 180000,
    hostCertified: true,
    rating: 4.9,
    reviewCount: 214,
    duration: '2 horas',
    capacity: 'Hasta 6 personas por turno',
    maxGuests: 6,
    ownerName: 'Ricardo Pena',
    ownerType: 'Guia certificado',
    includes: ['Equipo de seguridad', 'Briefing inicial', 'Acompanamiento de instructor'],
    latitude: 6.8031,
    longitude: -73.0965,
  },
  {
    id: 'exp-2',
    imageUrl: 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=1200&auto=format&fit=crop',
    title: 'Tour gastronomico local',
    description:
      'Prueba sabores tradicionales en un recorrido guiado por plazas de mercado y cocinas de autor.',
    summary:
      'Ruta culinaria por tres estaciones con degustaciones, historia de platos tipicos y recomendaciones de restaurantes.',
    category: 'Gastronomia',
    categories: ['Gastronomia', 'Cultura', 'Local'],
    location: 'Bogota, Cundinamarca',
    priceFrom: 95000,
    hostCertified: true,
    rating: 4.7,
    reviewCount: 162,
    duration: '3 horas',
    capacity: 'Hasta 10 personas por grupo',
    maxGuests: 10,
    ownerName: 'Sofia Gomez',
    ownerType: 'Host',
    includes: ['4 degustaciones', 'Bebida tradicional', 'Guia gastronomico'],
    latitude: 6.8031,
    longitude: -73.0965,
  },
  {
    id: 'exp-3',
    imageUrl: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200&auto=format&fit=crop',
    title: 'Caminata eco cultural',
    description:
      'Recorre senderos naturales y conoce historias ancestrales de la region con guias locales.',
    summary:
      'Experiencia de baja intensidad fisica que mezcla naturaleza, memoria oral y observacion de flora nativa.',
    category: 'Naturaleza',
    categories: ['Naturaleza', 'Cultura', 'Senderismo'],
    location: 'Villa de Leyva, Boyaca',
    priceFrom: 120000,
    hostCertified: false,
    rating: 4.8,
    reviewCount: 97,
    duration: '4 horas',
    capacity: 'Hasta 12 personas por salida',
    maxGuests: 12,
    ownerName: 'Colectivo Raices',
    ownerType: 'Agencia',
    includes: ['Entrada a reserva', 'Guia local', 'Hidratacion'],
    latitude: 6.8031,
    longitude: -73.0965,
  },
  {
    id: 'exp-4',
    imageUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1200&auto=format&fit=crop',
    title: 'Noche de observacion astral',
    description:
      'Descubre constelaciones y fenomenos celestes con telescopios profesionales en cielo despejado.',
    summary:
      'Sesion nocturna guiada por astronomos aficionados con apoyo visual y mini taller de fotografia nocturna.',
    category: 'Cultura',
    categories: ['Cultura', 'Ciencia', 'Nocturna'],
    location: 'Tatacoa, Huila',
    priceFrom: 140000,
    hostCertified: true,
    rating: 4.6,
    reviewCount: 88,
    duration: '2.5 horas',
    capacity: 'Hasta 20 personas',
    maxGuests: 20,
    ownerName: 'Estrella del Sur',
    ownerType: 'Agencia',
    includes: ['Acceso a telescopios', 'Charla introductoria', 'Bebida caliente'],
    latitude: 6.8031,
    longitude: -73.0965,
  },
  {
    id: 'exp-5',
    imageUrl: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&auto=format&fit=crop',
    title: 'Clase de cocina tradicional',
    description:
      'Aprende recetas tipicas de la region y cocina junto a anfitriones locales en una casa taller.',
    summary:
      'Clase practica paso a paso con ingredientes frescos y guia para replicar recetas en casa.',
    category: 'Gastronomia',
    categories: ['Gastronomia', 'Taller', 'Tradicion'],
    location: 'Medellin, Antioquia',
    priceFrom: 110000,
    hostCertified: false,
    rating: 4.5,
    reviewCount: 73,
    duration: '3.5 horas',
    capacity: 'Hasta 8 personas',
    maxGuests: 8,
    ownerName: 'Maria Ospina',
    ownerType: 'Host',
    includes: ['Ingredientes', 'Recetario digital', 'Degustacion final'],
    latitude: 6.8031,
    longitude: -73.0965,
  },
  {
    id: 'exp-6',
    imageUrl: 'https://images.unsplash.com/photo-1549880181-56a44cf4a9a5?w=1200&auto=format&fit=crop',
    title: 'Ruta de aventura en rio',
    description:
      'Desciende por rapidos de nivel intermedio con equipo completo y acompanamiento profesional.',
    summary:
      'Actividad de rafting para grupos con enfoque en seguridad, trabajo en equipo y diversion.',
    category: 'Aventura',
    categories: ['Aventura', 'Naturaleza', 'Rafting'],
    location: 'Puerto Berrio, Antioquia',
    priceFrom: 210000,
    hostCertified: true,
    rating: 4.9,
    reviewCount: 131,
    duration: '5 horas',
    capacity: 'Hasta 14 personas',
    maxGuests: 14,
    ownerName: 'Navega Outdoor',
    ownerType: 'Guia certificado',
    includes: ['Transporte interno', 'Equipo de seguridad', 'Snack'],
    latitude: 6.8031,
    longitude: -73.0965,
  },
];

