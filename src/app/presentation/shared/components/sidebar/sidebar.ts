import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  @Input() activeRoute: string = '';

  menuItems: MenuItem[] = [
    { icon: 'calendar', label: 'Reservaciones', route: '/booking' },
    { icon: 'hotel', label: 'Check-in', route: '/checkin' },
    { icon: 'dashboard', label: 'Propiedades y Unidades', route: '/properties' },
    { icon: 'people', label: 'Registrar Empleado', route: '/register-employee' },
    { icon: 'reports', label: 'Resumen de Ventas', route: '/sales-summary' },
    { icon: 'calendar', label: 'Sincronizar Calendarios', route: '/calendar-sync' },
    { icon: 'settings', label: 'Configuración de Correos', route: '/email-config' },
    { icon: 'lock', label: 'Cambiar Contraseña', route: '/change-password' },
    { icon: 'reports', label: 'Novedades Laborales', route: '/incident-report/list' },
    { icon: 'settings', label: 'Perfil del Negocio', route: '/tenant-profile' },
    { icon: 'reports', label: 'Registros de Auditoría', route: '/audit-log' },
  ];

  isActive(route: string): boolean {
    return this.activeRoute === route;
  }
}
