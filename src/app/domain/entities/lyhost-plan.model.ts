export interface LyhostPlan {
  name: string;
  price: string;
  description: string;
  properties: string;
  features: string[];
  highlighted: boolean;
}

export const LYHOST_PLANS: LyhostPlan[] = [
  {
    name: 'Starter',
    price: '49',
    description: 'Para propietarios con pocas propiedades',
    properties: 'Hasta 5 propiedades',
    features: [
      'Channel Manager básico',
      'Calendario unificado',
      'Landing de reservas',
      'Soporte por email',
      'Métricas básicas',
    ],
    highlighted: false,
  },
  {
    name: 'Profesional',
    price: '129',
    description: 'Para gestores que escalan su negocio',
    properties: 'Hasta 25 propiedades',
    features: [
      'Channel Manager avanzado',
      'CRM de huéspedes',
      'Precios dinámicos',
      'API de integración',
      'Reportes avanzados',
      'Soporte prioritario',
      'Landing con marca propia',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Para cadenas y grandes operaciones',
    properties: 'Propiedades ilimitadas',
    features: [
      'Todo en Profesional',
      'Multi-usuario con roles',
      'SLA garantizado',
      'Integraciones custom',
      'Account manager dedicado',
      'Onboarding personalizado',
    ],
    highlighted: false,
  },
];
