import { ROOM_LABELS } from '@/domain/shared/property/room.constants';

export interface NavLeaf {
  readonly label: string;
  readonly route: string;
}

export interface NavGroup {
  readonly id: string;
  readonly label: string;
  /** Bootstrap icon name, registered by the sidebar. */
  readonly icon: string;
  readonly items: readonly NavLeaf[];
}

export const HOME_NAV: NavLeaf & { readonly icon: string } = {
  label: 'Inicio',
  route: '/admin/dashboard',
  icon: 'bootstrapGrid',
};

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: 'operation',
    label: 'Operación',
    icon: 'bootstrapCalendar2Check',
    items: [
      { label: 'Reservas', route: '/admin/reservations' },
      { label: 'Huéspedes', route: '/admin/crm/guests' },
      { label: 'Experiencias', route: '/admin/experiences' },
    ],
  },
  {
    id: 'team',
    label: 'Equipo',
    icon: 'bootstrapPeople',
    items: [
      { label: 'Empleados', route: '/admin/staff' },
      { label: 'Turnos', route: '/admin/shifts' },
      { label: 'Novedades laborales', route: '/admin/incidents' },
    ],
  },
  {
    id: 'business',
    label: 'Negocio',
    icon: 'bootstrapHouseDoor',
    items: [
      { label: ROOM_LABELS.propertiesAndRooms, route: '/admin/properties' },
      { label: 'Registros de auditoría', route: '/admin/audit-log' },
    ],
  },
];

/** Pages that exist but have no sidebar entry; they still need a header label. */
const EXTRA_PAGES: readonly { route: string; label: string; group: string | null }[] = [
  { route: '/admin/units', label: 'Habitaciones', group: 'Negocio' },
  { route: '/admin/settings', label: 'Configuración', group: null },
  { route: '/admin/plans', label: 'Planes', group: null },
];

export interface Crumb {
  readonly group: string | null;
  readonly label: string;
}

function pathOf(url: string): string {
  return url.split(/[?#]/)[0];
}

/** True when `url` is `route` or a page below it (`/admin/staff/new` is under `/admin/staff`). */
export function isUnderRoute(url: string, route: string): boolean {
  const path = pathOf(url);
  return path === route || path.startsWith(`${route}/`);
}

export function groupOfUrl(url: string): NavGroup | null {
  return NAV_GROUPS.find((g) => g.items.some((i) => isUnderRoute(url, i.route))) ?? null;
}

export function resolveCrumb(url: string): Crumb {
  if (isUnderRoute(url, HOME_NAV.route)) return { group: null, label: HOME_NAV.label };

  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => isUnderRoute(url, i.route));
    if (item) return { group: group.label, label: item.label };
  }

  const extra = EXTRA_PAGES.find((p) => isUnderRoute(url, p.route));
  return extra ? { group: extra.group, label: extra.label } : { group: null, label: '' };
}
