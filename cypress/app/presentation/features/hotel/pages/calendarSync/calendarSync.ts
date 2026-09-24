import { Component } from '@angular/core';
import {
  HotelPageActionsDirective,
  HotelPageLayoutComponent,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import {
  bootstrapArrowRepeat,
  bootstrapCalendar,
  bootstrapCheck2,
  bootstrapInfoCircle,
  bootstrapLink45deg,
} from '@ng-icons/bootstrap-icons';

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
  imports: [HotelPageLayoutComponent, HotelPageActionsDirective, NgIcon, ButtonComponent],
  providers: [
    provideIcons({
      bootstrapCalendar,
      bootstrapLink45deg,
      bootstrapArrowRepeat,
      bootstrapInfoCircle,
      bootstrapCheck2,
    }),
  ],
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
      color: 'var(--color-primary-dark)'
    },
    {
      label: 'Reservas Activas',
      value: '20',
      subtitle: 'En todas las plataformas',
      icon: 'calendar',
      color: 'var(--color-primary)'
    },
    {
      label: 'Última Sincronización',
      value: '14:30',
      subtitle: 'Hace 5 minutos',
      icon: 'refresh',
      color: 'var(--color-primary)'
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
