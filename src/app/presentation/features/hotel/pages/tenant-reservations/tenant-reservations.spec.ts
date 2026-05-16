import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TenantReservations } from './tenant-reservations';

describe('TenantReservations', () => {
  let component: TenantReservations;
  let fixture: ComponentFixture<TenantReservations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantReservations]
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
