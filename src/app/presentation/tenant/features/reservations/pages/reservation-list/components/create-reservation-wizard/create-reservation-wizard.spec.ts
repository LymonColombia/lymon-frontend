import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateReservationWizardComponent } from './create-reservation-wizard';
import { CreateTenantGuestUseCase } from '@/domain/use-cases/reservation/create-tenant-guest.use-case';
import { CreateReservationUseCase } from '@/domain/use-cases/reservation/create-reservation.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { GetTenantGuestsUseCase } from '@/domain/use-cases/reservation/get-tenant-guests.use-case';

const mockCreateTenantGuestUseCase = { execute: vi.fn() };
const mockCreateReservationUseCase = { execute: vi.fn() };
const mockGetPropertiesUseCase = { execute: vi.fn() };
const mockGetUnitsUseCase = { execute: vi.fn() };
const mockGetTenantGuestsUseCase = { execute: vi.fn() };

async function setup() {
  const testingModule = TestBed.configureTestingModule({
    imports: [CreateReservationWizardComponent],
    providers: [
      { provide: CreateTenantGuestUseCase, useValue: mockCreateTenantGuestUseCase },
      { provide: CreateReservationUseCase, useValue: mockCreateReservationUseCase },
      { provide: GetPropertiesUseCase, useValue: mockGetPropertiesUseCase },
      { provide: GetUnitsUseCase, useValue: mockGetUnitsUseCase },
      { provide: GetTenantGuestsUseCase, useValue: mockGetTenantGuestsUseCase },
    ],
  });

  testingModule.overrideComponent(CreateReservationWizardComponent, {
    set: { imports: [], template: '' },
  });

  await testingModule.compileComponents();

  const fixture = TestBed.createComponent(CreateReservationWizardComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component };
}

function fillValidReservationForm(
  component: CreateReservationWizardComponent,
  overrides: Partial<typeof component.reservationForm> = {},
): void {
  component.reservationForm.guestId = 'guest-1';
  component.reservationForm.propertyId = 'property-1';
  component.reservationForm.unitId = 'unit-1';
  component.reservationForm.checkIn = '2026-07-01';
  component.reservationForm.checkOut = '2026-07-05';
  component.reservationForm.guestsCount = 2;
  Object.assign(component.reservationForm, overrides);
}

describe('CreateReservationWizardComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();

    mockGetPropertiesUseCase.execute.mockReturnValue(of([]));
    mockGetTenantGuestsUseCase.execute.mockReturnValue(of([]));
    mockGetUnitsUseCase.execute.mockReturnValue(of([]));
    mockCreateReservationUseCase.execute.mockReturnValue(of({}));
    mockCreateTenantGuestUseCase.execute.mockReturnValue(of({ guestId: 'guest-new', fullName: 'New Guest', primaryEmail: 'new@test.com' }));
  });

  describe('onSubmit() — date-string pass-through (LYMON-1092)', () => {
    it('should submit checkIn/checkOut as raw YYYY-MM-DD strings without any Date round-trip', async () => {
      const { component } = await setup();
      fillValidReservationForm(component);

      component.onSubmit();

      expect(mockCreateReservationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ checkIn: '2026-07-01', checkOut: '2026-07-05' }),
      );
    });

    it('should pass through the full reservation payload including guestsCount coerced to a number', async () => {
      const { component } = await setup();
      fillValidReservationForm(component, { notes: 'Llegada tardía', source: 'MANUAL' });

      component.onSubmit();

      expect(mockCreateReservationUseCase.execute).toHaveBeenCalledWith({
        propertyId: 'property-1',
        unitId: 'unit-1',
        guestId: 'guest-1',
        checkIn: '2026-07-01',
        checkOut: '2026-07-05',
        guestsCount: 2,
        source: 'MANUAL',
        notes: 'Llegada tardía',
      });
    });

    it('should omit notes when the notes field is empty', async () => {
      const { component } = await setup();
      fillValidReservationForm(component, { notes: '' });

      component.onSubmit();

      expect(mockCreateReservationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ notes: undefined }),
      );
    });

    it('should emit reservationCreated and close the wizard on success', async () => {
      const { component } = await setup();
      fillValidReservationForm(component);
      const reservationCreatedSpy = vi.fn();
      const closeWizardSpy = vi.fn();
      component.reservationCreated.subscribe(reservationCreatedSpy);
      component.closeWizard.subscribe(closeWizardSpy);

      component.onSubmit();

      expect(reservationCreatedSpy).toHaveBeenCalled();
      expect(closeWizardSpy).toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
    });

    it('should set an error message and stop submitting when the use-case fails', async () => {
      mockCreateReservationUseCase.execute.mockReturnValue(
        throwError(() => ({ error: { message: 'La habitación ya está reservada.' } })),
      );
      const { component } = await setup();
      fillValidReservationForm(component);

      component.onSubmit();

      expect(component.isSubmitting()).toBe(false);
      expect(component.errorMessage()).toBe('La habitación ya está reservada.');
    });
  });

  describe('validateReservation() — lexicographic date comparison (via onSubmit)', () => {
    it('should accept checkOut strictly after checkIn', async () => {
      const { component } = await setup();
      fillValidReservationForm(component, { checkIn: '2026-07-01', checkOut: '2026-07-02' });

      component.onSubmit();

      expect(component.errorMessage()).toBeNull();
      expect(mockCreateReservationUseCase.execute).toHaveBeenCalled();
    });

    it('should reject when checkOut equals checkIn', async () => {
      const { component } = await setup();
      fillValidReservationForm(component, { checkIn: '2026-07-01', checkOut: '2026-07-01' });

      component.onSubmit();

      expect(component.errorMessage()).toBe('La fecha de salida debe ser posterior a la fecha de entrada.');
      expect(mockCreateReservationUseCase.execute).not.toHaveBeenCalled();
    });

    it('should reject when checkOut is before checkIn', async () => {
      const { component } = await setup();
      fillValidReservationForm(component, { checkIn: '2026-07-10', checkOut: '2026-07-01' });

      component.onSubmit();

      expect(component.errorMessage()).toBe('La fecha de salida debe ser posterior a la fecha de entrada.');
      expect(mockCreateReservationUseCase.execute).not.toHaveBeenCalled();
    });

    it('should correctly compare dates spanning a year boundary lexicographically', async () => {
      const { component } = await setup();
      fillValidReservationForm(component, { checkIn: '2026-12-30', checkOut: '2027-01-02' });

      component.onSubmit();

      expect(component.errorMessage()).toBeNull();
      expect(mockCreateReservationUseCase.execute).toHaveBeenCalled();
    });

    it('should reject a malformed checkIn date string (not YYYY-MM-DD)', async () => {
      const { component } = await setup();
      fillValidReservationForm(component, { checkIn: '07/01/2026', checkOut: '2026-07-05' });

      component.onSubmit();

      expect(component.errorMessage()).toBe('Las fechas seleccionadas no son válidas.');
      expect(mockCreateReservationUseCase.execute).not.toHaveBeenCalled();
    });

    it('should reject a malformed checkOut date string (not YYYY-MM-DD)', async () => {
      const { component } = await setup();
      fillValidReservationForm(component, { checkIn: '2026-07-01', checkOut: 'not-a-date' });

      component.onSubmit();

      expect(component.errorMessage()).toBe('Las fechas seleccionadas no son válidas.');
      expect(mockCreateReservationUseCase.execute).not.toHaveBeenCalled();
    });

    it('should reject when checkIn is a full ISO datetime instead of a bare date', async () => {
      const { component } = await setup();
      fillValidReservationForm(component, {
        checkIn: '2026-07-01T15:00:00.000Z',
        checkOut: '2026-07-05',
      });

      component.onSubmit();

      expect(component.errorMessage()).toBe('Las fechas seleccionadas no son válidas.');
      expect(mockCreateReservationUseCase.execute).not.toHaveBeenCalled();
    });

    it('should require guestId, propertyId, unitId, checkIn, and checkOut before validating dates', async () => {
      const { component } = await setup();

      component.onSubmit();

      expect(component.errorMessage()).toBe('Debes seleccionar un huésped.');
      expect(mockCreateReservationUseCase.execute).not.toHaveBeenCalled();
    });

    it('should reject a guestsCount below 1', async () => {
      const { component } = await setup();
      fillValidReservationForm(component, { guestsCount: 0 });

      component.onSubmit();

      expect(component.errorMessage()).toBe('La cantidad de huéspedes debe ser al menos 1.');
      expect(mockCreateReservationUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('ngOnInit()', () => {
    it('should load properties and map missing names to a fallback label', async () => {
      mockGetPropertiesUseCase.execute.mockReturnValue(
        of([{ id: 'p1', name: '', propertyType: 'hotel', city: 'Bogota' }]),
      );

      const { component } = await setup();

      expect(component.properties()).toEqual([{ id: 'p1', name: 'Propiedad sin nombre' }]);
    });

    it('should load tenant guests and prefer fullName over name/email fallbacks', async () => {
      mockGetTenantGuestsUseCase.execute.mockReturnValue(
        of([
          { id: 'g1', fullName: 'Carlos Ruiz' },
          { id: 'g2', name: 'Only Name' },
          { id: 'g3', primaryEmail: 'only-email@test.com' },
          { id: 'g4' },
        ]),
      );

      const { component } = await setup();

      expect(component.guests()).toEqual([
        { id: 'g1', name: 'Carlos Ruiz' },
        { id: 'g2', name: 'Only Name' },
        { id: 'g3', name: 'only-email@test.com' },
        { id: 'g4', name: 'Sin Nombre' },
      ]);
    });
  });

  describe('onPropertySelect()', () => {
    it('should load units for the selected property', async () => {
      mockGetUnitsUseCase.execute.mockReturnValue(of([{ id: 'u1', name: 'Suite 101' }]));
      const { component } = await setup();

      component.onPropertySelect('property-1');

      expect(mockGetUnitsUseCase.execute).toHaveBeenCalledWith('property-1');
      expect(component.units()).toEqual([{ id: 'u1', name: 'Suite 101' }]);
    });

    it('should clear units and reset unitId without calling the use-case when propertyId is empty', async () => {
      const { component } = await setup();
      component.reservationForm.unitId = 'previous-unit';

      component.onPropertySelect('');

      expect(mockGetUnitsUseCase.execute).not.toHaveBeenCalled();
      expect(component.units()).toEqual([]);
      expect(component.reservationForm.unitId).toBe('');
    });
  });

  describe('step navigation', () => {
    it('should skip step 2 when the guest is already registered', async () => {
      const { component } = await setup();

      component.setGuestRegistered(true);

      expect(component.currentStep()).toBe(3);
    });

    it('should go through step 2 when the guest is not registered', async () => {
      const { component } = await setup();

      component.setGuestRegistered(false);

      expect(component.currentStep()).toBe(2);
    });

    it('should not advance currentStep past 3', async () => {
      const { component } = await setup();
      component.currentStep.set(3);

      component.nextStep();

      expect(component.currentStep()).toBe(3);
    });

    it('should not go below step 1', async () => {
      const { component } = await setup();

      component.prevStep();

      expect(component.currentStep()).toBe(1);
    });
  });

  describe('registerAndNext()', () => {
    it('should not submit when fullName or primaryEmail are missing', async () => {
      const { component } = await setup();
      component.guestForm.fullName = '';
      component.guestForm.primaryEmail = 'a@test.com';

      component.registerAndNext();

      expect(mockCreateTenantGuestUseCase.execute).not.toHaveBeenCalled();
    });

    it('should create the guest, prefill guestId, and advance to the next step', async () => {
      const { component } = await setup();
      component.guestForm.fullName = 'New Guest';
      component.guestForm.primaryEmail = 'new@test.com';

      component.registerAndNext();

      expect(component.reservationForm.guestId).toBe('guest-new');
      expect(component.guests()).toEqual([{ id: 'guest-new', name: 'New Guest' }]);
      expect(component.isCreatingGuest()).toBe(false);
      // registerAndNext() only calls nextStep() — it does not set guestIsRegistered(),
      // so from step 1 (default) it advances by one, not straight to the confirmation step.
      expect(component.currentStep()).toBe(2);
    });

    it('should set an error message when guest creation fails', async () => {
      mockCreateTenantGuestUseCase.execute.mockReturnValue(throwError(() => new Error('duplicate email')));
      const { component } = await setup();
      component.guestForm.fullName = 'New Guest';
      component.guestForm.primaryEmail = 'new@test.com';

      component.registerAndNext();

      expect(component.isCreatingGuest()).toBe(false);
      expect(component.errorMessage()).toBe('Error al registrar el huésped. Por favor intenta de nuevo.');
    });
  });

  describe('onClose()', () => {
    it('should emit closeWizard', async () => {
      const { component } = await setup();
      const closeWizardSpy = vi.fn();
      component.closeWizard.subscribe(closeWizardSpy);

      component.onClose();

      expect(closeWizardSpy).toHaveBeenCalled();
    });
  });

  describe('today getter', () => {
    it('should return a YYYY-MM-DD formatted string', async () => {
      const { component } = await setup();

      expect(component.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
