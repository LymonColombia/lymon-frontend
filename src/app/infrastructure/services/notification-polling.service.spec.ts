import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NotificationPollingService } from './notification-polling.service';
import { GetReservationsUseCase } from '@/domain/use-cases/reservation/get-reservations.use-case';
import { GetIncidentReportsUseCase } from '@/domain/tenant/incident-report/use-cases/get-incident-reports.use-case';
import { UserSessionService } from './user-session.service';
import { Reservation } from '@/domain/entities/reservation.model';
import { IncidentReport } from '@/domain/tenant/incident-report/incident-report.model';
import type { PaginatedReservations } from '@/domain/repositories/reservation.repository';

const mockGetReservationsUseCase = { execute: vi.fn() };
const mockGetIncidentReportsUseCase = { execute: vi.fn() };
const mockUserSessionService = { tenantId: 'tenant-1' as string | null };

const BASE_RESERVATION: Reservation = {
  id: 'res-1',
  tenantId: 'tenant-1',
  propertyId: 'property-1',
  unitId: 'unit-1',
  guestId: 'guest-1',
  checkIn: '2026-07-01',
  checkOut: '2026-07-05',
  nights: 4,
  source: 'direct',
  status: 'pending',
  guestsCount: 2,
  pricePerNight: 100,
  totalPrice: 400,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

function paginated(reservations: Reservation[]): PaginatedReservations {
  return { reservations, total: reservations.length };
}

function setup(): NotificationPollingService {
  TestBed.configureTestingModule({
    providers: [
      { provide: GetReservationsUseCase, useValue: mockGetReservationsUseCase },
      { provide: GetIncidentReportsUseCase, useValue: mockGetIncidentReportsUseCase },
      { provide: UserSessionService, useValue: mockUserSessionService },
    ],
  });

  return TestBed.inject(NotificationPollingService);
}

describe('NotificationPollingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUserSessionService.tenantId = 'tenant-1';
    mockGetReservationsUseCase.execute.mockReturnValue(of(paginated([])));
    mockGetIncidentReportsUseCase.execute.mockReturnValue(of([]));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('buildReservationNotification (via startPolling)', () => {
    it('should render the correct calendar day for a checkIn date-only string near a UTC/local day boundary', () => {
      // Regression guard for LYMON-1092: "2026-07-01" has no time component and must always
      // render as July 1st regardless of the timezone of the machine running the test.
      mockGetReservationsUseCase.execute.mockReturnValue(
        of(paginated([{ ...BASE_RESERVATION, guestName: 'Ana Perez', room: 'Suite 5' }])),
      );

      const service = setup();
      service.startPolling();

      const notifications = service.notifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toBe('Nueva reserva de Ana Perez — Habitación Suite 5, 1 de jul de 2026');
      expect(notifications[0].message).not.toContain('30 de jun');
    });

    it('should fall back to guestId and unitId when guestName and room are blank', () => {
      mockGetReservationsUseCase.execute.mockReturnValue(
        of(paginated([{ ...BASE_RESERVATION, guestName: '   ', room: '' }])),
      );

      const service = setup();
      service.startPolling();

      const message = service.notifications()[0].message;
      expect(message).toContain('guest-1');
      expect(message).toContain('unit-1');
    });

    it('should use "Fecha por definir" when checkIn is missing', () => {
      mockGetReservationsUseCase.execute.mockReturnValue(
        of(paginated([{ ...BASE_RESERVATION, checkIn: '' }])),
      );

      const service = setup();
      service.startPolling();

      expect(service.notifications()[0].message).toContain('Fecha por definir');
    });

    it('should build an id prefixed with "reservation-" and mark it unread', () => {
      mockGetReservationsUseCase.execute.mockReturnValue(of(paginated([BASE_RESERVATION])));

      const service = setup();
      service.startPolling();

      const notification = service.notifications()[0];
      expect(notification.id).toBe('reservation-res-1');
      expect(notification.type).toBe('reservation');
      expect(notification.read).toBe(false);
    });
  });

  describe('buildIncidentNotification (via startPolling)', () => {
    const BASE_INCIDENT: IncidentReport = {
      id: 'incident-1',
      title: 'Fuga de agua',
      description: 'Se reporta una fuga de agua en el baño principal de la habitación 204, requiere atención urgente.',
      propertyId: 'property-1',
      createdAt: '2026-06-01T00:00:00.000Z',
    };

    it('should build a labor notification truncated to 80 characters with an ellipsis', () => {
      mockGetIncidentReportsUseCase.execute.mockReturnValue(of([BASE_INCIDENT]));

      const service = setup();
      service.startPolling();

      const notification = service.notifications()[0];
      expect(notification.id).toBe('incident-incident-1');
      expect(notification.type).toBe('labor');
      expect(notification.message.startsWith('Fuga de agua — ')).toBe(true);
      expect(notification.message).toContain('…');
    });

    it('should not truncate a short description', () => {
      mockGetIncidentReportsUseCase.execute.mockReturnValue(
        of([{ ...BASE_INCIDENT, description: 'Corto' }]),
      );

      const service = setup();
      service.startPolling();

      expect(service.notifications()[0].message).toBe('Fuga de agua — Corto');
    });
  });

  describe('runPoll / tenant guard', () => {
    it('should not call the use-cases when there is no tenantId', () => {
      mockUserSessionService.tenantId = null;

      const service = setup();
      service.startPolling();

      expect(mockGetReservationsUseCase.execute).not.toHaveBeenCalled();
      expect(mockGetIncidentReportsUseCase.execute).not.toHaveBeenCalled();
      expect(service.notifications()).toEqual([]);
    });

    it('should pass tenantId, pending status, and pagination params to GetReservationsUseCase', () => {
      const service = setup();
      service.startPolling();

      expect(mockGetReservationsUseCase.execute).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        status: 'pending',
        page: 1,
        limit: 1000,
      });
    });
  });

  describe('error handling', () => {
    it('should swallow reservation fetch errors and keep polling without throwing', () => {
      mockGetReservationsUseCase.execute.mockReturnValue(throwError(() => new Error('network down')));

      const service = setup();
      expect(() => service.startPolling()).not.toThrow();
      expect(service.notifications()).toEqual([]);
    });

    it('should swallow incident fetch errors and keep polling without throwing', () => {
      mockGetIncidentReportsUseCase.execute.mockReturnValue(throwError(() => new Error('network down')));

      const service = setup();
      expect(() => service.startPolling()).not.toThrow();
      expect(service.notifications()).toEqual([]);
    });
  });

  describe('deduplication and polling lifecycle', () => {
    it('should not duplicate the same reservation notification across multiple polls', () => {
      vi.useFakeTimers();
      mockGetReservationsUseCase.execute.mockReturnValue(of(paginated([BASE_RESERVATION])));

      const service = setup();
      service.startPolling();
      expect(service.notifications()).toHaveLength(1);

      vi.advanceTimersByTime(15_000);
      expect(service.notifications()).toHaveLength(1);
      expect(mockGetReservationsUseCase.execute).toHaveBeenCalledTimes(2);
    });

    it('should add a notification for a newly seen reservation on a later poll', () => {
      vi.useFakeTimers();
      mockGetReservationsUseCase.execute.mockReturnValueOnce(of(paginated([BASE_RESERVATION])));

      const service = setup();
      service.startPolling();
      expect(service.notifications()).toHaveLength(1);

      mockGetReservationsUseCase.execute.mockReturnValueOnce(
        of(paginated([BASE_RESERVATION, { ...BASE_RESERVATION, id: 'res-2' }])),
      );
      vi.advanceTimersByTime(15_000);

      expect(service.notifications()).toHaveLength(2);
    });

    it('should stop emitting new notifications after stopPolling is called', () => {
      vi.useFakeTimers();
      mockGetReservationsUseCase.execute.mockReturnValue(of(paginated([BASE_RESERVATION])));

      const service = setup();
      service.startPolling();
      service.stopPolling();

      vi.advanceTimersByTime(60_000);
      expect(mockGetReservationsUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should be a no-op when startPolling is called while already polling', () => {
      const service = setup();
      service.startPolling();
      service.startPolling();

      expect(mockGetReservationsUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('markAllRead / unreadCount', () => {
    it('should mark every notification as read and update unreadCount to zero', () => {
      mockGetReservationsUseCase.execute.mockReturnValue(of(paginated([BASE_RESERVATION])));

      const service = setup();
      service.startPolling();
      expect(service.unreadCount()).toBe(1);

      service.markAllRead();

      expect(service.unreadCount()).toBe(0);
      expect(service.notifications().every((n) => n.read)).toBe(true);
    });
  });
});
