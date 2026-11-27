import { UiIconName } from '@/presentation/shared/ui/ui-icon/ui-icon';

export interface NavLeaf {
  readonly label: string;
  readonly route: string;
}

export interface NavGroup {
  readonly id: string;
  readonly label: string;
  readonly icon: UiIconName;
  readonly items: readonly NavLeaf[];
}

export const HOME_NAV: NavLeaf & { readonly icon: UiIconName } = {
  label: 'Inicio',
  route: '/admin/dashboard',
  icon: 'home',
};

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: 'operation',
    label: 'Operación',
    icon: 'operation',
    items: [
      { label: 'Reservas', route: '/admin/reservations' },
      // Needs a property: without ?propertyId the page sends you to Propiedades to pick one.
      { label: 'Habitaciones', route: '/admin/units' },
      { label: 'Huéspedes', route: '/admin/crm/guests' },
      { label: 'Experiencias', route: '/admin/experiences' },
    ],
  },
  {
    id: 'team',
    label: 'Equipo',
    icon: 'team',
    items: [
      { label: 'Personas', route: '/admin/staff' },
      { label: 'Turnos', route: '/admin/shifts' },
    ],
  },
  {
    id: 'business',
    label: 'Negocio',
    icon: 'business',
    items: [
      { label: 'Propiedades', route: '/admin/properties' },
      // No reports page exists yet; the audit log stands in until one does.
      { label: 'Reportes', route: '/admin/audit-log' },
    ],
  },
];

/** Pages that exist but have no sidebar entry; they still need a header label. */
const EXTRA_PAGES: readonly { route: string; label: string; group: string | null }[] = [
  { route: '/admin/incidents', label: 'Novedades laborales', group: 'Equipo' },
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
