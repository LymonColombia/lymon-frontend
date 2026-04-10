import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '@/presentation/shared/components/sidebar/sidebar';

interface Metric {
  label: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
}

interface Platform {
  name: string;
  logo: string;
  connected: boolean;
  lastSync?: string;
  activeReservations?: number;
}

@Component({
  selector: 'app-calendar-sync',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './calendarSync.html',
  styleUrl: './calendarSync.css'
})
export class CalendarSyncComponent {
  metrics: Metric[] = [
    {
      label: 'Plataformas Conectadas',
      value: '2',
      subtitle: 'de 2 disponibles',
      icon: 'link',
      color: '#009A44'
    },
    {
      label: 'Reservas Activas',
      value: '20',
      subtitle: 'En todas las plataformas',
      icon: 'calendar',
      color: '#6CC24A'
    },
    {
      label: 'Última Sincronización',
      value: '14:30',
      subtitle: 'Hace 5 minutos',
      icon: 'refresh',
      color: '#6CC24A'
    }
  ];

  platforms: Platform[] = [
    {
      name: 'Airbnb',
      logo: '/images/airbnb-logo.png',
      connected: true,
      lastSync: '2026-02-09 14:30',
      activeReservations: 8
    },
    {
      name: 'Booking.com',
      logo: '/images/booking-logo.png',
      connected: true,
      lastSync: '2026-02-09 14:25',
      activeReservations: 12
    }
  ];

  syncAll(): void {
    console.log('Sincronizando todas las plataformas...');
  }

  connectPlatform(platformName: string): void {
    console.log(`Conectando con ${platformName}...`);
  }

  disconnectPlatform(platformName: string): void {
    console.log(`Desconectando de ${platformName}...`);
  }
}
