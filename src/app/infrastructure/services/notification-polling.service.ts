import { Injectable, computed, inject, signal } from '@angular/core';
import {
  catchError,
  EMPTY,
  forkJoin,
  interval,
  map,
  Observable,
  of,
  startWith,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { Notification } from '@/domain/entities/notification.model';
import { Reservation } from '@/domain/entities/reservation.model';
import { IncidentReport } from '@/domain/entities/incident-report.model';
import { GetReservationsUseCase } from '@/domain/use-cases/reservation/get-reservations.use-case';
import { GetIncidentReportsUseCase } from '@/domain/use-cases/incident/get-incident-reports.use-case';
import { UserSessionService } from './user-session.service';

const POLL_INTERVAL_MS = 15_000;

@Injectable({ providedIn: 'root' })
export class NotificationPollingService {
  private readonly getReservationsUseCase = inject(GetReservationsUseCase);
  private readonly getIncidentReportsUseCase = inject(GetIncidentReportsUseCase);
  private readonly userSessionService = inject(UserSessionService);

  private readonly _notifications = signal<Notification[]>([]);
  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(() => this._notifications().filter((n) => !n.read).length);

  private pollingSubscription?: Subscription;
  private readonly seenReservationIds = new Set<string>();
  private readonly seenIncidentIds = new Set<string>();

  startPolling(): void {
    if (this.pollingSubscription) return;

    this.pollingSubscription = interval(POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.runPoll()),
        catchError((err) => {
          console.error('Notification polling failed', err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = undefined;
  }

  markAllRead(): void {
    this._notifications.update((list) => list.map((n) => (n.read ? n : { ...n, read: true })));
  }

  private runPoll(): Observable<void> {
    const tenantId = this.userSessionService.tenantId;
    if (!tenantId) {
      return of(undefined);
    }

    return forkJoin({
      reservations: this.fetchPendingReservations(tenantId),
      incidents: this.fetchIncidentReports(tenantId),
    }).pipe(
      tap(({ reservations, incidents }) => this.processNewItems(reservations, incidents)),
      map(() => undefined),
    );
  }

  private fetchPendingReservations(tenantId: string): Observable<Reservation[]> {
    return this.getReservationsUseCase
      .execute({ tenantId, status: 'pending', page: 1, limit: 1000 })
      .pipe(
        map((paginated) => paginated.reservations),
        catchError((err) => {
          console.error('Error polling pending reservations', err);
          return of([]);
        }),
      );
  }

  private fetchIncidentReports(tenantId: string): Observable<IncidentReport[]> {
    return this.getIncidentReportsUseCase.execute(tenantId).pipe(
      catchError((err) => {
        console.error('Error polling incident reports', err);
        return of([]);
      }),
    );
  }

  private processNewItems(reservations: Reservation[], incidents: IncidentReport[]): void {
    const newNotifications: Notification[] = [];

    for (const reservation of reservations) {
      if (!this.seenReservationIds.has(reservation.id)) {
        this.seenReservationIds.add(reservation.id);
        newNotifications.push(this.buildReservationNotification(reservation));
      }
    }

    for (const incident of incidents) {
      if (!this.seenIncidentIds.has(incident.id)) {
        this.seenIncidentIds.add(incident.id);
        newNotifications.push(this.buildIncidentNotification(incident));
      }
    }

    if (newNotifications.length === 0) return;

    newNotifications.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
    this._notifications.update((list) => {
      const merged = [...newNotifications, ...list];
      merged.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
      return merged;
    });
  }

  private buildReservationNotification(reservation: Reservation): Notification {
    const guest = reservation.guestName?.trim() || reservation.guestId;
    const room = reservation.room?.trim() || reservation.unitId;
    const checkIn = reservation.checkIn
      ? new Date(reservation.checkIn).toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'Fecha por definir';

    return {
      id: `reservation-${reservation.id}`,
      type: 'reservation',
      message: `Nueva reserva de ${guest} — Habitación ${room}, ${checkIn}`,
      detectedAt: new Date(),
      read: false,
    };
  }

  private buildIncidentNotification(incident: IncidentReport): Notification {
    const description = this.truncate(incident.description, 80);
    return {
      id: `incident-${incident.id}`,
      type: 'labor',
      message: `${incident.title} — ${description}`,
      detectedAt: new Date(),
      read: false,
    };
  }

  private truncate(value: string, maxLength: number): string {
    const trimmed = value?.trim() ?? '';
    return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}…` : trimmed;
  }
}
