import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  ElementRef,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
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
  bootstrapThreeDotsVertical,
} from '@ng-icons/bootstrap-icons';

import { GetTenantProfileUseCase } from '@/domain/use-cases/tenant/get-tenant-profile.use-case';
import { TokenService } from '@/infrastructure/services/token.service';
import { UserSessionService } from '@/infrastructure/services/user-session.service';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';

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
  imports: [RouterModule, NgIconComponent, ModalComponent, ButtonComponent],
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
      bootstrapThreeDotsVertical,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeProfileMenu()',
  },
})
export class SidebarComponent implements OnInit {
  @ViewChild('profileMenuContainer', { read: ElementRef })
  private readonly profileMenuContainer?: ElementRef<HTMLElement>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly getTenantProfileUseCase = inject(GetTenantProfileUseCase);
  private readonly userSession = inject(UserSessionService);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  readonly isExpanded = signal(getInitialSidebarExpandedState());
  readonly transitionsReady = signal(false);
  readonly tenantName = signal('');
  readonly tenantEmail = signal('');

  readonly isProfileMenuOpen = signal(false);
  readonly isLogoutConfirmOpen = signal(false);

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

    this.closeProfileMenu();
    this.updateLayoutSidebarWidthVariable();
  }

  toggleProfileMenu(): void {
    if (!this.isExpanded()) return;
    this.isProfileMenuOpen.set(!this.isProfileMenuOpen());
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen.set(false);
  }

  goToSettings(): void {
    this.closeProfileMenu();
    void this.router.navigateByUrl('/settings');
  }

  openLogoutConfirm(): void {
    this.closeProfileMenu();
    this.isLogoutConfirmOpen.set(true);
  }

  closeLogoutConfirm(): void {
    this.isLogoutConfirmOpen.set(false);
  }

  confirmLogout(): void {
    this.closeLogoutConfirm();
    this.closeProfileMenu();
    this.tokenService.clear();
    this.userSession.clear();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.isProfileMenuOpen()) return;

    const container = this.profileMenuContainer?.nativeElement;
    if (!container) {
      this.closeProfileMenu();
      return;
    }

    const target = event.target as Node | null;
    if (target && container.contains(target)) return;

    this.closeProfileMenu();
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
