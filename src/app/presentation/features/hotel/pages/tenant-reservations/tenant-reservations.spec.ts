import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TenantReservations } from './tenant-reservations';
import { ReservationRepository } from '@/domain/repositories/reservation.repository';
import { StaffRepository } from '@/domain/repositories/staff.repository';
import { TenantGuestRepository } from '@/domain/repositories/tenant-guest.repository';

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
});
