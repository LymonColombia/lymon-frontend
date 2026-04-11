import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBoxArrowRight,
  bootstrapClockHistory,
  bootstrapDisplay,
  bootstrapExclamationTriangle,
  bootstrapGeoAlt,
  bootstrapGlobe,
  bootstrapLaptop,
  bootstrapPhone,
  bootstrapPersonLinesFill
} from '@ng-icons/bootstrap-icons';

import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';

interface SessionItem {
  id: string;
  deviceName: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActiveLabel: string;
  state: 'current' | 'recent' | 'old';
  deviceType: 'laptop' | 'phone' | 'desktop';
}

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [HotelPageLayoutComponent, NgIcon],
  providers: [
    provideIcons({
      bootstrapBoxArrowRight,
      bootstrapClockHistory,
      bootstrapDisplay,
      bootstrapExclamationTriangle,
      bootstrapGeoAlt,
      bootstrapGlobe,
      bootstrapLaptop,
      bootstrapPhone,
      bootstrapPersonLinesFill
    }),
  ],
  templateUrl: './sessions.html',
  styleUrl: './sessions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionsComponent {
  readonly sessions = signal<SessionItem[]>([
    {
      id: 'session-1',
      deviceName: 'MacBook Pro',
      browser: 'Chrome 122',
      location: 'Bogota, Colombia',
      ipAddress: '181.49.214.67',
      lastActiveLabel: 'Ahora',
      state: 'current',
      deviceType: 'laptop',
    },
    {
      id: 'session-2',
      deviceName: 'iPhone 15 Pro',
      browser: 'Safari 17',
      location: 'Medellin, Colombia',
      ipAddress: '181.53.102.88',
      lastActiveLabel: 'Hace 2 horas',
      state: 'recent',
      deviceType: 'phone',
    },
    {
      id: 'session-3',
      deviceName: 'Windows PC',
      browser: 'Edge 122',
      location: 'Cali, Colombia',
      ipAddress: '190.26.77.143',
      lastActiveLabel: 'Hace 1 dia',
      state: 'old',
      deviceType: 'desktop',
    },
  ]);

  readonly totalSessions = computed(() => this.sessions().length);
  readonly activeSessions = computed(() => this.sessions().filter((item) => item.state === 'current').length);
  readonly differentDevices = computed(() => new Set(this.sessions().map((item) => item.deviceType)).size);

  getDeviceIcon(type: SessionItem['deviceType']): string {
    if (type === 'phone') return 'bootstrapPhone';
    if (type === 'desktop') return 'bootstrapDisplay';
    return 'bootstrapLaptop';
  }
}
