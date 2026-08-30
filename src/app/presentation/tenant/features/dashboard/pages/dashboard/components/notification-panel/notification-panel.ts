import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBell,
  bootstrapBellFill,
  bootstrapCalendarEvent,
  bootstrapExclamationTriangle,
} from '@ng-icons/bootstrap-icons';
import { NotificationPollingService } from '@/infrastructure/services/notification-polling.service';
import { Notification } from '@/domain/tenant/notification/notification.model';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      bootstrapBell,
      bootstrapBellFill,
      bootstrapCalendarEvent,
      bootstrapExclamationTriangle,
    }),
  ],
  templateUrl: './notification-panel.html',
  styleUrl: './notification-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPanelComponent implements OnDestroy {
  private readonly notificationService = inject(NotificationPollingService);
  private readonly elementRef = inject(ElementRef);
  private readonly nowInterval: ReturnType<typeof setInterval>;

  readonly isOpen = signal(false);
  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly now = signal<Date>(new Date());

  constructor() {
    this.nowInterval = setInterval(() => this.now.set(new Date()), 60_000);
  }

  ngOnDestroy(): void {
    clearInterval(this.nowInterval);
  }

  toggle(): void {
    this.isOpen.update((open) => !open);
    if (this.isOpen()) {
      this.notificationService.markAllRead();
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  markAllRead(): void {
    this.notificationService.markAllRead();
  }

  badgeCount(): string {
    const count = this.unreadCount();
    return count > 99 ? '99+' : String(count);
  }

  typeLabel(notification: Notification): string {
    return notification.type === 'reservation' ? 'Reserva' : 'Novedad laboral';
  }

  iconName(notification: Notification): string {
    return notification.type === 'reservation'
      ? 'bootstrapCalendarEvent'
      : 'bootstrapExclamationTriangle';
  }

  relativeTime(date: Date): string {
    const seconds = Math.floor((this.now().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'hace un momento';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `hace ${days} d`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target as Node;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.close();
    }
  }
}
