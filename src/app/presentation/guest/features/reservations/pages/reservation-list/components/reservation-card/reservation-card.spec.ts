import { TestBed } from '@angular/core/testing';
import { ReservationCardComponent } from './reservation-card';
import { GuestReservationResponse } from '@/domain/guest/guest-reservation/guest-reservation.model';

const BASE_RESERVATION: GuestReservationResponse = {
  id: 'reservation-abcdefgh12345678',
  bookingReference: 'BR-0001',
  propertyId: 'property-1',
  propertyName: 'Hotel Central',
  unitId: 'unit-1',
  unitName: 'Suite 101',
  status: 'confirmed',
  checkIn: '2026-07-01',
  checkOut: '2026-07-05',
  nights: 4,
  guestsCount: 2,
  pricePerNight: 100,
  totalPrice: 400,
};

async function setup(reservation: GuestReservationResponse = BASE_RESERVATION) {
  await TestBed.configureTestingModule({
    imports: [ReservationCardComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(ReservationCardComponent);
  fixture.componentRef.setInput('reservation', reservation);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance };
}

describe('ReservationCardComponent', () => {
  describe('formatDay()', () => {
    it('should render the correct calendar day for a date-only checkIn string near a UTC/local day boundary', async () => {
      // Regression guard for LYMON-1092: "2026-07-01" (Wednesday, no time component) must never
      // roll back to "30 jun" (Tuesday) regardless of the local timezone of the test runner.
      const { component } = await setup();

      const result = component.formatDay('2026-07-01');

      expect(result).toBe('mié, 1 jul');
      expect(result).not.toContain('30 jun');
    });

    it('should format a different date correctly', async () => {
      const { component } = await setup();

      const result = component.formatDay('2026-12-25');

      expect(result).toBe('vie, 25 dic');
    });
  });

  describe('formatYear()', () => {
    it('should render the correct year for a date-only checkOut string', async () => {
      const { component } = await setup();

      const result = component.formatYear('2026-07-05');

      expect(result).toBe('2026');
    });

    it('should not roll back to the previous year at a year boundary', async () => {
      const { component } = await setup();

      const result = component.formatYear('2027-01-01');

      expect(result).toBe('2027');
    });
  });

  describe('formatTime removal', () => {
    it('should no longer expose a formatTime method on the component', async () => {
      const { component } = await setup();

      expect((component as unknown as Record<string, unknown>)['formatTime']).toBeUndefined();
    });
  });

  describe('other computed fields (unaffected by the timezone fix)', () => {
    it('should compute nights from the explicit nights field when present', async () => {
      const { component } = await setup();

      expect(component.nights()).toBe(4);
    });

    it('should derive nights from checkIn/checkOut when nights and priceBreakdown are absent', async () => {
      const { component } = await setup({
        ...BASE_RESERVATION,
        nights: undefined,
        priceBreakdown: undefined,
        checkIn: '2026-07-01',
        checkOut: '2026-07-04',
      });

      expect(component.nights()).toBe(3);
    });

    it('should map status to the Spanish label', async () => {
      const { component } = await setup({ ...BASE_RESERVATION, status: 'checked_in' });

      expect(component.statusLabel()).toBe('En estadía');
    });
  });
});
