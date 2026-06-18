import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TenantReservations } from './tenant-reservations';
import { ReservationRepository } from '@/domain/repositories/reservation.repository';

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
            getReservations: () => of([]),
            getReservationById: () => of(),
            create: () => of()
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
