import { PlanType } from '@/domain/tenant/auth/auth.model';
import { ROOM_LABELS } from '@/domain/constants/room.constants';

export interface PlanDetailSection {
  title: string;
  items: string[];
}

export interface Plan {
  type: PlanType;
  name: string;
  subtitle: string;
  price: string;
  priceSuffix?: string;
  priceNote?: string;
  isFree?: boolean;
  detailsSections: PlanDetailSection[];
}

export const PLANS: readonly Plan[] = [
  {
    type: 'TRIAL',
    name: 'Prueba LyHost',
    subtitle: '5 días para descubrir todo el potencial.',
    price: '$0',
    isFree: true,
    priceNote: 'Acceso de prueba por tiempo limitado',
    detailsSections: [
      {
        title: 'ACCESO',
        items: ['Acceso completo a todos los módulos'],
      },
    ],
  },
  {
    type: 'LYMON_ONE',
    name: 'LyHost One',
    subtitle: 'Ideal para propietarios independientes',
    price: '$89.900',
    priceSuffix: '/mes',
    priceNote: 'Pago mensual sin compromiso',
    detailsSections: [
      {
        title: 'CAPACIDAD',
        items: ['Hasta 5 propiedades', 'Hasta 2 usuarios', ROOM_LABELS.unlimitedRooms],
      },
      {
        title: 'GESTIÓN',
        items: [
          'Gestión básica de inventario',
          'Registro de auditoría',
          '2 experiencias activas',
          'Landing privada personalizada',
          'Roles y turnos básicos',
        ],
      },
    ],
  },
  {
    type: 'PLUS',
    name: 'LyHost Plus',
    subtitle: 'Para administradores profesionales',
    price: '$189.900',
    priceSuffix: '/mes',
    priceNote: 'Incluye todo lo de LyHost One +',
    detailsSections: [
      {
        title: 'CAPACIDAD',
        items: ['Hasta 20 propiedades', 'Hasta 10 usuarios', ROOM_LABELS.unlimitedRooms],
      },
      {
        title: 'FUNCIONES PREMIUM',
        items: ['Landing privada personalizada', 'CRM integrado'],
      },
      {
        title: 'GESTIÓN AVANZADA',
        items: ['Reportes y analíticas', 'Gestión financiera básica', 'Soporte prioritario'],
      },
    ],
  },
  {
    type: 'PRIME',
    name: 'LyHost Prime',
    subtitle: 'Solución completa sin límites',
    price: '$349.900',
    priceSuffix: '/mes',
    priceNote: 'Todo incluido',
    detailsSections: [
      {
        title: 'CAPACIDAD',
        items: ['Propiedades ilimitadas', 'Usuarios ilimitados', ROOM_LABELS.unlimitedRooms],
      },
      {
        title: 'SOPORTE ENTERPRISE',
        items: ['Soporte 24/7', 'Capacitación personalizada'],
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

export function isFreePlan(plan: Plan): boolean {
  if (plan.isFree === true) return true;
  const price = plan.price?.trim();
  return price === '$0' || price === '0' || price === 'Gratis' || plan.type === 'TRIAL';
}
