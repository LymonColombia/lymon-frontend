import { PlanType } from './auth.model';

export interface LyhostPlanDetailSection {
  title: string;
  items: string[];
}

export interface LyhostPlan {
  type: PlanType;
  name: string;
  subtitle: string;
  price: string;
  priceSuffix?: string;
  priceNote?: string;
  detailsSections: LyhostPlanDetailSection[];
}

export const LYHOST_PLANS: readonly LyhostPlan[] = [
  {
    type: 'TRIAL',
    name: 'Trial',
    subtitle: 'Prueba Lymon antes de suscribirte',
    price: '$0',
    priceNote: 'Acceso de prueba por tiempo limitado',
    detailsSections: [
      {
        title: 'CAPACIDAD',
        items: ['Hasta 1 propiedad', 'Unidades ilimitadas'],
      },
      {
        title: 'INTEGRACIONES',
        items: ['Airbnb', 'Booking.com'],
      },
      {
        title: 'GESTIÓN',
        items: ['Multicalendario unificado', 'Inbox combinado'],
      },
    ],
  },
  {
    type: 'LYMON_ONE',
    name: 'LymonOne',
    subtitle: 'Ideal para propietarios independientes',
    price: '$89.900',
    priceSuffix: '/mes',
    priceNote: 'Pago mensual sin compromiso',
    detailsSections: [
      {
        title: 'CAPACIDAD',
        items: ['Hasta 5 propiedades', 'Hasta 2 usuarios', 'Unidades ilimitadas'],
      },
      {
        title: 'INTEGRACIONES',
        items: ['Airbnb', 'Booking.com'],
      },
      {
        title: 'GESTIÓN',
        items: ['Multicalendario unificado', 'Inbox combinado', 'Roles y turnos básicos'],
      },
    ],
  },
  {
    type: 'PLUS',
    name: 'LymonPlus',
    subtitle: 'Para administradores profesionales',
    price: '$189.900',
    priceSuffix: '/mes',
    priceNote: 'Incluye todo lo de LymonOne +',
    detailsSections: [
      {
        title: 'CAPACIDAD',
        items: ['Hasta 20 propiedades', 'Hasta 10 usuarios', 'Unidades ilimitadas'],
      },
      {
        title: 'FUNCIONES PREMIUM',
        items: ['Landing privada personalizada', 'CRM integrado', 'Turnos con biometría'],
      },
      {
        title: 'GESTIÓN AVANZADA',
        items: ['Reportes y analíticas', 'Gestión financiera básica', 'Soporte prioritario'],
      },
    ],
  },
  {
    type: 'PRIME',
    name: 'LymonPrime',
    subtitle: 'Solución completa sin límites',
    price: '$349.900',
    priceSuffix: '/mes',
    priceNote: 'Todo incluido + personalización',
    detailsSections: [
      {
        title: 'CAPACIDAD',
        items: ['Propiedades ilimitadas', 'Usuarios ilimitados', 'Unidades ilimitadas'],
      },
      {
        title: 'PREMIUM FEATURES',
        items: ['Todo lo de LymonPlus', 'API completa', 'White-label disponible'],
      },
      {
        title: 'SOPORTE ENTERPRISE',
        items: ['Account manager dedicado', 'Soporte 24/7', 'Capacitación personalizada'],
      },
    ],
  },
];

export function isPlanType(value: unknown): value is PlanType {
  return value === 'TRIAL' || value === 'LYMON_ONE' || value === 'PLUS' || value === 'PRIME';
}

export function normalizePlanType(value: unknown): PlanType | null {
  if (value === 'LYMON_PLUS') {
    return 'PLUS';
  }
  return isPlanType(value) ? value : null;
}
