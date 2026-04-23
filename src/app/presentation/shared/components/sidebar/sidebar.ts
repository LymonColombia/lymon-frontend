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
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapBarChartFill,
  bootstrapCalendar,
  bootstrapCurrencyDollar,
  bootstrapEnvelopeAt,
  bootstrapGrid,
  bootstrapHouseDoor,
  bootstrapHouseFill,
  bootstrapInfoCircle,
  bootstrapLayoutSidebar,
  bootstrapPeople,
  bootstrapPersonAdd,
  bootstrapPersonGear,
  bootstrapStar,
  bootstrapThreeDotsVertical,
  bootstrapArchive,
  bootstrapClockHistory
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


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, NgIconComponent, ModalComponent, ButtonComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  providers: [
    provideIcons({
      bootstrapBarChartFill,
      bootstrapCalendar,
      bootstrapCurrencyDollar,
      bootstrapEnvelopeAt,
      bootstrapGrid,
      bootstrapHouseDoor,
      bootstrapHouseFill,
      bootstrapInfoCircle,
      bootstrapLayoutSidebar,
      bootstrapPeople,
      bootstrapPersonAdd,
      bootstrapPersonGear,
      bootstrapStar,
      bootstrapThreeDotsVertical,
      bootstrapArchive,
      bootstrapClockHistory
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sidebar-host--expanded]': 'isExpanded()',
    '[class.sidebar-host--ready]': 'transitionsReady()',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscapeKey()',
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

  readonly isExpanded = signal(false);
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
    { icon: 'bootstrapArchive', label: 'Inventario', route: '/inventory' },
    { icon: 'bootstrapHouseDoor', label: 'Propiedades y Unidades', route: '/properties' },
    { icon: 'bootstrapPersonAdd', label: 'Registrar Empleado', route: '/register-employee' },
    { icon: 'bootstrapPeople', label: 'Gesti\u00f3n de Empleados', route: '/employee-management' },
    { icon: 'bootstrapClockHistory', label: 'Turnos', route: '/staff-shift' },
    { icon: 'bootstrapCurrencyDollar', label: 'Resumen de Ventas', route: '/sales-summary' },
    { icon: 'bootstrapCalendar', label: 'Sincronizar Calendarios', route: '/calendar-sync' },
    { icon: 'bootstrapEnvelopeAt', label: 'Configuración de Correos', route: '/email-config' },
    { icon: 'bootstrapInfoCircle', label: 'Registros de Auditoría', route: '/audit-log' },
    { icon: 'bootstrapPeople', label: 'CRM de Huéspedes', route: '/crm/guests' },
    { icon: 'bootstrapBarChartFill', label: 'Novedades Laborales', route: '/incident-report/list' },
  ];

  toggleExpanded(): void {
    this.isExpanded.update((v) => !v);
    this.closeProfileMenu();
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

  goToPlans(): void {
    this.closeProfileMenu();
    void this.router.navigateByUrl('/plans');
  }

  goToSessions(): void {
    this.closeProfileMenu();
    void this.router.navigateByUrl('/sessions');
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

  onEscapeKey(): void {
    this.closeProfileMenu();
    if (this.isExpanded()) {
      this.toggleExpanded();
    }
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
    requestAnimationFrame(() => {
      this.transitionsReady.set(true);
    });

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.isExpanded.set(false);
        this.closeProfileMenu();
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
