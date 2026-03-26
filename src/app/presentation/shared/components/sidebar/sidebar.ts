import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapBarChartFill,
  bootstrapCalendar,
  bootstrapChevronLeft,
  bootstrapChevronRight,
  bootstrapGear,
  bootstrapGrid,
  bootstrapHouseFill,
  bootstrapPersonLock,
  bootstrapPersonAdd,
  bootstrapHouseDoor,
  bootstrapCurrencyDollar,
  bootstrapEnvelopeAt,
  bootstrapInfoCircle,
  bootstrapPeople,
} from '@ng-icons/bootstrap-icons';

import { GetTenantProfileUseCase } from '@/domain/use-cases/tenant/get-tenant-profile.use-case';
import { UserSessionService } from '@/infrastructure/services/user-session.service';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

const SIDEBAR_EXPANDED_STORAGE_KEY = 'sidebar-expanded';
const SIDEBAR_EXPANDED_WIDTH = '260px';
const SIDEBAR_COLLAPSED_WIDTH = '80px';

function getInitialSidebarExpandedState(): boolean {
  try {
    const storedValue = globalThis.localStorage?.getItem(SIDEBAR_EXPANDED_STORAGE_KEY);
    return storedValue === null ? true : storedValue === 'true';
  } catch {
    return true;
  }
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, NgIconComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  providers: [
    provideIcons({
      bootstrapGrid,
      bootstrapCalendar,
      bootstrapHouseFill,
      bootstrapPersonAdd,
      bootstrapBarChartFill,
      bootstrapGear,
      bootstrapPersonLock,
      bootstrapChevronLeft,
      bootstrapChevronRight,
      bootstrapHouseDoor,
      bootstrapCurrencyDollar,
      bootstrapEnvelopeAt,
      bootstrapInfoCircle,
      bootstrapPeople,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getTenantProfileUseCase = inject(GetTenantProfileUseCase);
  private readonly userSession = inject(UserSessionService);

  readonly isExpanded = signal(getInitialSidebarExpandedState());
  readonly transitionsReady = signal(false);
  readonly tenantName = signal('');
  readonly tenantEmail = signal('');

  readonly tenantNameDisplay = computed(() => this.tenantName().trim() || '—');
  readonly tenantEmailDisplay = computed(() => this.tenantEmail().trim() || '—');

  readonly tenantInitials = computed(() => {
    const name = this.tenantName().trim();
    if (!name) return '—';

    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.charAt(0) ?? '';
    const second = (parts.length > 1 ? parts[1]?.charAt(0) : parts[0]?.charAt(1)) ?? '';
    const initials = (first + second).toUpperCase();
    return initials || '—';
  });

  readonly menuItems: MenuItem[] = [
    { icon: 'bootstrapGrid', label: 'Inicio', route: '/dashboard' },
    { icon: 'bootstrapCalendar', label: 'Reservaciones', route: '/booking' },
    { icon: 'bootstrapHouseFill', label: 'Check-in', route: '/checkin' },
    { icon: 'bootstrapHouseDoor', label: 'Propiedades y Unidades', route: '/properties' },
    { icon: 'bootstrapPersonAdd', label: 'Registrar Empleado', route: '/register-employee' },
    { icon: 'bootstrapCurrencyDollar', label: 'Resumen de Ventas', route: '/sales-summary' },
    { icon: 'bootstrapCalendar', label: 'Sincronizar Calendarios', route: '/calendar-sync' },
    { icon: 'bootstrapEnvelopeAt', label: 'Configuración de Correos', route: '/email-config' },
    { icon: 'bootstrapInfoCircle', label: 'Registros de Auditoría', route: '/audit-log' },
    { icon: 'bootstrapPeople', label: 'CRM de Huéspedes', route: '/crm/guests' },
    { icon: 'bootstrapBarChartFill', label: 'Novedades Laborales', route: '/incident-report/list' },
    { icon: 'bootstrapPersonLock', label: 'Configuración', route: '/settings' },
  ];

  private updateLayoutSidebarWidthVariable(): void {
    const sidebarWidth = this.isExpanded() ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;
    document.documentElement.style.setProperty('--layout-sidebar-width', sidebarWidth);
  }

  toggleExpanded(): void {
    this.isExpanded.update((v) => {
      const nextState = !v;
      try {
        localStorage.setItem(SIDEBAR_EXPANDED_STORAGE_KEY, String(nextState));
      } catch {}
      return nextState;
    });

    this.updateLayoutSidebarWidthVariable();
  }

  ngOnInit(): void {
    this.updateLayoutSidebarWidthVariable();

    requestAnimationFrame(() => {
      this.transitionsReady.set(true);
    });

    this.getTenantProfileUseCase
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.tenantName.set(res.data?.name ?? '');
          this.tenantEmail.set(res.data?.email ?? this.userSession.currentUser()?.email ?? '');
        },
        error: () => {
          this.tenantName.set('');
          this.tenantEmail.set(this.userSession.currentUser()?.email ?? '');
        },
      });
  }
}
