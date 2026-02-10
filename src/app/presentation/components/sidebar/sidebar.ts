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
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  @Input() activeRoute: string = '';

  menuItems: MenuItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'calendar', label: 'Reservaciones', route: '/booking' },
    { icon: 'hotel', label: 'Habitaciones', route: '/rooms' },
    { icon: 'inventory', label: 'Inventario', route: '/inventory' },
    { icon: 'services', label: 'Servicios', route: '/services' },
    { icon: 'people', label: 'Huéspedes', route: '/guests' },
    { icon: 'reports', label: 'Reportes', route: '/reports' },
    { icon: 'receipt', label: 'Facturación', route: '/billing' },
    { icon: 'settings', label: 'Configuración', route: '/settings' }
  ];

  isActive(route: string): boolean {
    return this.activeRoute === route;
  }
}
