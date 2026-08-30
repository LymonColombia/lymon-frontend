export interface PlanFeature {
  title: string;
  description: string;
  icon: string;
}

export const PLAN_FEATURES: PlanFeature[] = [
  {
    title: 'Reserva Directa',
    description:
      'Reserva sin intermediarios directamente con el alojamiento. Mejor precio y comunicación directa.',
    icon: 'bootstrapWindow',
  },
  {
    title: 'Gestión Centralizada',
    description:
      'Todas tus propiedades, reservas, personal y finanzas en un solo panel de control.',
    icon: 'bootstrapBuildingGear',
  },
  {
    title: 'Conoce a tus huéspedes',
    description:
      'Historial de cada persona que se queda contigo. Así tendrás comunicaciones personalizadas y cada visita se sentirá como en casa.',
    icon: 'bootstrapPeople',
  },
  {
    title: 'Métricas en Tiempo Real',
    description: 'Ocupación, ingresos y huéspedes activos. Todo actualizado al instante desde cualquier dispositivo.',
    icon: 'bootstrapGraphUpArrow',
  },
  {
    title: 'Tu hotel con tu identidad',
    description:
      'Cada propiedad tiene su propia página de reservas con tu identidad. Tus huéspedes reservan contigo, no con un intermediario.',
    icon: 'bootstrapWindowStack',
  },
];
