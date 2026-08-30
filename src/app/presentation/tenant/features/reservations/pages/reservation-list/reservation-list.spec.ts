import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TenantReservations, ReservationViewModel } from './reservation-list';
import { ReservationRepository } from '@/domain/shared/reservation/reservation.repository';
import { StaffRepository } from '@/domain/tenant/staff/staff.repository';
import { TenantGuestRepository } from '@/domain/tenant/tenant-guest/tenant-guest.repository';

describe('TenantReservations', () => {
  let component: TenantReservations;
  let fixture: ComponentFixture<TenantReservations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantReservations],
      providers: [
        {
          provide: ReservationRepository,
          useValue: {
            getReservations: () => of({ reservations: [], total: 0 }),
            getReservationById: () => of(),
            create: () => of(),
            update: () => of(),
            confirm: () => of(undefined),
            checkIn: () => of(undefined),
            checkOut: () => of(undefined),
            cancel: () => of(undefined)
          }
        },
        {
          provide: StaffRepository,
          useValue: {
            getProperties: () => of({ data: [] }),
            getUnits: () => of({ data: { units: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } } }),
            getPublicUnits: () => of({ data: { units: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } } }),
            getStaff: () => of([]),
            getRoles: () => of({ roles: [] }),
            addStaff: () => of(),
            getPublicUnit: () => of({ data: { unit: { id: '1', name: 'Unit' } } }),
            deleteStaff: () => of()
          }
        },
        {
          provide: TenantGuestRepository,
          useValue: {
            createGuest: () => of({ guestId: '1', fullName: 'Guest', primaryEmail: 'guest@test.com' }),
            getGuests: () => of([])
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TenantReservations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('filters', () => {
    const baseReservation: ReservationViewModel = {
      id: 'r1',
      reservationNumber: 1001,
      guestName: 'Ana López',
      guestEmail: 'ana@mail.com',
      guestPhone: '',
      propertyName: 'Hotel Central',
      unitName: 'Suite 101',
      checkIn: '2026-07-01',
      checkOut: '2026-07-05',
      status: 'Confirmada',
      totalAmount: 500,
      createdAt: ''
    };

    beforeEach(() => {
      component.reservations.set([
        { ...baseReservation, id: 'r1', reservationNumber: 1001, guestName: 'Ana López', guestEmail: 'ana@mail.com', unitName: 'Suite 101', status: 'Confirmada' },
        { ...baseReservation, id: 'r2', reservationNumber: 1002, guestName: 'Luis Pérez', guestEmail: 'luis@mail.com', unitName: 'Habitación 201', status: 'Pendiente' },
        { ...baseReservation, id: 'r3', reservationNumber: 1003, guestName: 'Carla Ruiz', guestEmail: 'carla@mail.com', unitName: 'Habitación 203', status: 'Cancelada' },
        { ...baseReservation, id: 'r4', reservationNumber: 1004, guestName: 'Ana Torres', guestEmail: 'ana.torres@mail.com', propertyName: 'Vista Mar', unitName: 'Habitación 202', status: 'Check-in' },
        { ...baseReservation, id: 'r5', reservationNumber: 1005, guestName: 'Pedro Gómez', guestEmail: 'pedro@mail.com', unitName: 'Habitación 204', status: 'Finalizada' }
      ]);
    });

    it('default active filter shows pending, confirmed and check-in only', () => {
      component.statusFilter.set('active');
      const result = component.filteredReservations();
      expect(result).toHaveLength(3);
      expect(result.some((r) => r.status === 'Cancelada')).toBe(false);
      expect(result.some((r) => r.status === 'Finalizada')).toBe(false);
    });

    it('shows only pending reservations when pending filter is active', () => {
      component.statusFilter.set('pending');
      const result = component.filteredReservations();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Pendiente');
    });

    it('shows only confirmed reservations when confirmed filter is active', () => {
      component.statusFilter.set('confirmed');
      const result = component.filteredReservations();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Confirmada');
    });

    it('shows only checked-in reservations when checked-in filter is active', () => {
      component.statusFilter.set('checked-in');
      const result = component.filteredReservations();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Check-in');
    });

    it('shows only finished reservations when finished filter is active', () => {
      component.statusFilter.set('finished');
      const result = component.filteredReservations();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Finalizada');
    });

    it('shows only cancelled reservations when cancelled filter is active', () => {
      component.statusFilter.set('cancelled');
      const result = component.filteredReservations();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Cancelada');
    });

    it('shows all reservations when all filter is active', () => {
      component.statusFilter.set('all');
      expect(component.filteredReservations()).toHaveLength(5);
    });

    it('searches across guest name, email, reservation id and property by default', () => {
      component.searchTerm.set('Ana');
      const result = component.filteredReservations();
      expect(result).toHaveLength(2);
      expect(result.every((r) =>
        r.guestName.toLowerCase().includes('ana') ||
        r.guestEmail.toLowerCase().includes('ana')
      )).toBe(true);
    });

    it('finds reservation by email', () => {
      component.searchTerm.set('luis@mail.com');
      const result = component.filteredReservations();
      expect(result).toHaveLength(1);
      expect(result[0].guestEmail).toBe('luis@mail.com');
    });

    it('finds reservation by reservation number', () => {
      component.searchTerm.set('1004');
      const result = component.filteredReservations();
      expect(result).toHaveLength(1);
      expect(result[0].reservationNumber).toBe(1004);
    });

    it('finds reservation by property or unit name', () => {
      component.searchTerm.set('vista mar');
      const result = component.filteredReservations();
      expect(result).toHaveLength(1);
      expect(result[0].propertyName).toBe('Vista Mar');
    });

    it('finds reservation by unit name across all fields', () => {
      component.searchTerm.set('Suite 101');
      const result = component.filteredReservations();
      expect(result).toHaveLength(1);
      expect(result[0].unitName).toBe('Suite 101');
    });

    it('paginates filtered reservations', () => {
      const manyPending = Array.from({ length: 25 }, (_, i) => ({
        ...baseReservation,
        id: `p${i}`,
        reservationNumber: 2000 + i,
        guestName: `Guest ${i}`,
        guestEmail: `guest${i}@mail.com`,
        status: 'Pendiente'
      }));
      const confirmed = { ...baseReservation, id: 'c1', reservationNumber: 3001, status: 'Confirmada' };
      component.reservations.set([...manyPending, confirmed]);
      component.statusFilter.set('pending');
      component.filteredCurrentPage.set(1);

      expect(component.filteredTotalPages()).toBe(3);
      expect(component.pagedReservations()).toHaveLength(10);
      expect(component.pagedReservations()[0].reservationNumber).toBe(2000);

      component.nextPage();
      expect(component.filteredCurrentPage()).toBe(2);
      expect(component.pagedReservations()[0].reservationNumber).toBe(2010);

      component.statusFilter.set('confirmed');
      component.filteredCurrentPage.set(1);
      expect(component.filteredTotalPages()).toBe(1);
      expect(component.pagedReservations()).toHaveLength(1);
    });
  });
});
