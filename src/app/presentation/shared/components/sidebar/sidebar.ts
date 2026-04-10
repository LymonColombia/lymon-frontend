import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

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
})
export class SidebarComponent {
  menuItems: MenuItem[] = [
    { icon: 'dashboard', label: 'Inicio', route: '/dashboard' },
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
}
