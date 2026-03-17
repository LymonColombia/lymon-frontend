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

import { GetTenantProfileUseCase } from '@/domain/use-cases/tenant/get-tenant-profile.use-case';
import { UserSessionService } from '@/infrastructure/services/user-session.service';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getTenantProfileUseCase = inject(GetTenantProfileUseCase);
  private readonly userSession = inject(UserSessionService);

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
    { icon: 'dashboard', label: 'Inicio', route: '/dashboard' },
    { icon: 'calendar', label: 'Reservaciones', route: '/booking' },
    { icon: 'hotel', label: 'Check-in', route: '/checkin' },
    { icon: 'dashboard', label: 'Propiedades y Unidades', route: '/properties' },
    { icon: 'people', label: 'Registrar Empleado', route: '/register-employee' },
    { icon: 'reports', label: 'Resumen de Ventas', route: '/sales-summary' },
    { icon: 'calendar', label: 'Sincronizar Calendarios', route: '/calendar-sync' },
    { icon: 'settings', label: 'Configuración de Correos', route: '/email-config' },
    { icon: 'settings', label: 'Configuración', route: '/settings' },
    { icon: 'reports', label: 'Novedades Laborales', route: '/incident-report/list' },
    { icon: 'reports', label: 'Registros de Auditoría', route: '/audit-log' },
  ];

  ngOnInit(): void {
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
