import { TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, ParamMap, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { CheckinComponent } from './checkin';
import { GetReservationsUseCase } from '@/domain/shared/reservation/use-cases/get-reservations.use-case';
import { GetReservationByIdUseCase } from '@/domain/shared/reservation/use-cases/get-reservation-by-id.use-case';
import { GetGuestReservationByIdUseCase } from '@/domain/guest/guest-reservation/use-cases/get-guest-reservation-by-id.use-case';
import { ConfirmReservationUseCase } from '@/domain/shared/reservation/use-cases/confirm-reservation.use-case';
import { GuestTokenService } from '@/infrastructure/guest/services/guest-token.service';
import { Reservation } from '@/domain/shared/reservation/reservation.model';

const mockGetReservationsUseCase = { execute: vi.fn() };
const mockGetReservationByIdUseCase = { execute: vi.fn() };
const mockGetGuestReservationByIdUseCase = { execute: vi.fn() };
const mockConfirmReservationUseCase = { execute: vi.fn() };
const mockGuestTokenService = {
  getGuestEmail: vi.fn(),
  getGuestProfile: vi.fn(),
  clear: vi.fn(),
};

const BASE_RESERVATION: Reservation = {
  id: 'res-1',
  tenantId: 'tenant-1',
  propertyId: 'property-1',
  unitId: 'unit-1',
  guestId: 'guest-1',
  checkIn: '2026-04-10T15:00:00.000Z',
  checkOut: '2026-04-13T12:00:00.000Z',
  nights: 3,
  source: 'direct',
  status: 'confirmed',
  guestsCount: 2,
  pricePerNight: 500,
  totalPrice: 1500,
  createdAt: '2026-03-20T00:00:00.000Z',
  updatedAt: '2026-03-20T00:00:00.000Z',
};

let paramMap$: BehaviorSubject<ParamMap>;
let queryParamMap$: BehaviorSubject<ParamMap>;

function resetRouteParams(params: Record<string, string> = {}, query: Record<string, string> = {}): void {
  paramMap$.next(convertToParamMap(params));
  queryParamMap$.next(convertToParamMap(query));
}

function paginated(reservations: Reservation[]): { reservations: Reservation[]; total: number } {
  return { reservations, total: reservations.length };
}

function commonProviders() {
  return [
    provideRouter([]),
    { provide: GetReservationsUseCase, useValue: mockGetReservationsUseCase },
    { provide: GetReservationByIdUseCase, useValue: mockGetReservationByIdUseCase },
    { provide: GetGuestReservationByIdUseCase, useValue: mockGetGuestReservationByIdUseCase },
    { provide: ConfirmReservationUseCase, useValue: mockConfirmReservationUseCase },
    { provide: GuestTokenService, useValue: mockGuestTokenService },
    {
      provide: ActivatedRoute,
      useValue: {
        paramMap: paramMap$.asObservable(),
        queryParamMap: queryParamMap$.asObservable(),
        snapshot: {
          paramMap: convertToParamMap({}),
          queryParamMap: convertToParamMap({}),
        },
      },
    },
  ];
}

async function setup() {
  const testingModule = TestBed.configureTestingModule({
    imports: [CheckinComponent],
    providers: commonProviders(),
  });

  testingModule.overrideComponent(CheckinComponent, {
    set: {
      imports: [CommonModule],
      template: `
        <section>
          <aside class="summary-panel">
            <p class="summary-loading" *ngIf="isLoadingSummary()">Cargando reservacion...</p>
            <p class="summary-error" *ngIf="summaryError()">{{ summaryError() }}</p>
            <p class="guest">{{ reservationSummary().guestName }}</p>
            <p class="room">{{ reservationSummary().room }}</p>
            <p class="checkin">{{ reservationSummary().checkIn }}</p>
            <p class="checkout">{{ reservationSummary().checkOut }}</p>
            <p class="nights">{{ reservationSummary().nights }}</p>
            <p class="guests">{{ reservationSummary().guests }}</p>
            <p class="total">Total: {{ reservationSummary().total }}</p>
          </aside>
        </section>
      `,
    },
  });

  await testingModule.compileComponents();

  const fixture = TestBed.createComponent(CheckinComponent);
  const component = fixture.componentInstance;
  const router = TestBed.inject(Router);
  fixture.detectChanges();

  return { fixture, component, router };
}

async function setupWithFullTemplate() {
  await TestBed.configureTestingModule({
    imports: [CheckinComponent],
    providers: commonProviders(),
  }).compileComponents();

  const fixture = TestBed.createComponent(CheckinComponent);
  const component = fixture.componentInstance;
  const router = TestBed.inject(Router);
  fixture.detectChanges();

  return { fixture, component, router };
}

describe('CheckinComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    paramMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));
    queryParamMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));

    mockGetReservationsUseCase.execute.mockReturnValue(of(paginated([BASE_RESERVATION])));
    mockGetReservationByIdUseCase.execute.mockReturnValue(of(BASE_RESERVATION));
    mockGetGuestReservationByIdUseCase.execute.mockReturnValue(of(undefined));
    mockConfirmReservationUseCase.execute.mockReturnValue(of(undefined));
    mockGuestTokenService.getGuestEmail.mockReturnValue('guest@test.com');
    mockGuestTokenService.getGuestProfile.mockReturnValue({
      email: 'guest@test.com',
      firstName: 'Ana',
      lastName: null,
      fullName: null,
    });
  });

  it('crea el componente', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('carga reservacion por reservationId de query param', async () => {
    resetRouteParams({}, { reservationId: 'res-22' });
    mockGetReservationByIdUseCase.execute.mockReturnValue(
      of({ ...BASE_RESERVATION, id: 'res-22', guestName: 'Juliana Franco' }),
    );

    const { component } = await setup();

    expect(mockGetReservationByIdUseCase.execute).toHaveBeenCalledWith('res-22');
    expect(component.selectedReservation()?.id).toBe('res-22');
    expect(component.reservationSummary().guestName).toBe('Juliana Franco');
    expect(component.isLoadingSummary()).toBe(false);
  });

  it('usa reservationId de route param cuando no viene por query', async () => {
    resetRouteParams({ reservationId: 'route-res-id' }, {});

    const { component } = await setup();

    expect(mockGetReservationByIdUseCase.execute).toHaveBeenCalledWith('route-res-id');
    expect(component.selectedReservation()?.id).toBe('res-1');
  });

  it('si no hay reservationId usa el listado y elige una reservacion activa/confirmada/pending', async () => {
    const finishedReservation: Reservation = { ...BASE_RESERVATION, id: 'res-finished', status: 'finished' };
    const activeReservation: Reservation = {
      ...BASE_RESERVATION,
      id: 'res-active',
      status: 'active',
      guestName: 'Huesped Real',
    };

    mockGetReservationsUseCase.execute.mockReturnValue(of(paginated([finishedReservation, activeReservation])));

    const { component } = await setup();

    expect(mockGetReservationsUseCase.execute).toHaveBeenCalled();
    expect(component.selectedReservation()?.id).toBe('res-active');
    expect(component.reservationSummary().guestName).toBe('Huesped Real');
  });

  it('muestra error cuando falla getReservationById', async () => {
    resetRouteParams({}, { reservationId: 'missing-id' });
    mockGetReservationByIdUseCase.execute.mockReturnValue(
      throwError(() => new Error('reservation not found')),
    );

    const { component } = await setup();

    expect(component.selectedReservation()).toBeNull();
    expect(component.summaryError()).toBe('No se encontro una reservacion para mostrar.');
    expect(component.isLoadingSummary()).toBe(false);
  });

  it('mantiene loading en true mientras la lista de reservaciones no emite', async () => {
    const pendingReservations$ = new Subject<{ reservations: Reservation[]; total: number }>();
    mockGetReservationsUseCase.execute.mockReturnValue(pendingReservations$.asObservable());

    const { component } = await setup();
    expect(component.isLoadingSummary()).toBe(true);

    pendingReservations$.next(paginated([BASE_RESERVATION]));
    pendingReservations$.complete();

    expect(component.isLoadingSummary()).toBe(false);
    expect(component.selectedReservation()?.id).toBe('res-1');
  });

  it('respeta limites al navegar pasos', async () => {
    const { component } = await setup();

    component.goToPreviousStep();
    expect(component.currentStep()).toBe(1);

    component.goToNextStep();
    component.goToNextStep();
    component.goToNextStep();
    component.goToNextStep();

    expect(component.currentStep()).toBe(3);
    expect(component.isLastStep()).toBe(true);
    expect(component.progressPercent()).toBe(100);
  });

  it('renderiza resumen en la vista con datos de la reservacion', async () => {
    mockGetReservationsUseCase.execute.mockReturnValue(
      of(paginated([{ ...BASE_RESERVATION, guestName: 'Ana Perez', room: 'Suite 201', totalPrice: 2400 }])),
    );

    const { fixture } = await setup();
    fixture.detectChanges();

    const summaryText = fixture.nativeElement
      .querySelector('.summary-panel')
      .textContent.replace(/\s+/g, ' ')
      .trim();

    expect(summaryText).toContain('Ana Perez');
    expect(summaryText).toContain('Suite 201');
    expect(summaryText).toContain('Total:');
  });

  it('arma el formulario de huespedes segun guestsCount de la reservacion', async () => {
    mockGetReservationsUseCase.execute.mockReturnValue(of(paginated([{ ...BASE_RESERVATION, guestsCount: 3 }])));

    const { component } = await setup();

    expect(component.guests.length).toBe(3);
  });

  it('precarga el primer huesped con el perfil del token de guest', async () => {
    const { component } = await setup();

    expect(component.guests.at(0).value.email).toBe('guest@test.com');
    expect(component.guests.at(0).value.firstName).toBe('Ana');
  });

  it('no precarga a los huespedes adicionales, son solo visuales', async () => {
    mockGetReservationsUseCase.execute.mockReturnValue(of(paginated([{ ...BASE_RESERVATION, guestsCount: 2 }])));

    const { component } = await setup();

    expect(component.guests.at(1).value.email).toBe('');
    expect(component.guests.at(1).value.firstName).toBe('');
  });

  it('submitCheckin no confirma si no se aceptan los terminos', async () => {
    const { component } = await setup();

    component.submitCheckin();

    expect(mockConfirmReservationUseCase.execute).not.toHaveBeenCalled();
  });

  it('submitCheckin confirma la reservacion y navega al exito', async () => {
    const { component, router } = await setup();
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.checkinForm.controls.acceptedTerms.setValue(true);
    component.submitCheckin();

    expect(mockConfirmReservationUseCase.execute).toHaveBeenCalledWith('res-1');
    expect(navigateSpy).toHaveBeenCalledWith(['/guest/reservations']);
    expect(component.isConfirming()).toBe(false);
  });

  it('submitCheckin maneja el error de confirmacion', async () => {
    mockConfirmReservationUseCase.execute.mockReturnValue(throwError(() => new Error('failed')));

    const { component } = await setup();

    component.checkinForm.controls.acceptedTerms.setValue(true);
    component.submitCheckin();

    expect(component.isConfirming()).toBe(false);
    expect(component.confirmError()).toBe('No se pudo confirmar la reservación. Intenta de nuevo.');
  });

  describe('formatDate (via reservationSummary) — regresión LYMON-1092', () => {
    it('renderiza el dia calendario correcto para checkIn/checkOut de solo fecha cerca de un limite UTC/local', async () => {
      // "2026-07-01"/"2026-07-05" no tienen componente horario y deben mostrar
      // siempre el mismo dia calendario sin importar la zona horaria de la maquina de pruebas.
      mockGetReservationsUseCase.execute.mockReturnValue(
        of(paginated([{ ...BASE_RESERVATION, checkIn: '2026-07-01', checkOut: '2026-07-05' }])),
      );

      const { component } = await setup();

      expect(component.reservationSummary().checkIn).toBe('01 jul 2026');
      expect(component.reservationSummary().checkOut).toBe('05 jul 2026');
      expect(component.reservationSummary().checkIn).not.toContain('30 jun');
    });

    it('retorna "--" cuando checkIn es undefined en una reservacion de tenant', async () => {
      mockGetReservationByIdUseCase.execute.mockReturnValue(
        of({ ...BASE_RESERVATION, checkIn: undefined, checkOut: undefined }),
      );
      resetRouteParams({}, { reservationId: 'res-no-dates' });

      const { component } = await setup();

      expect(component.reservationSummary().checkIn).toBe('--');
      expect(component.reservationSummary().checkOut).toBe('--');
    });

    it('retorna el valor crudo cuando la fecha no se puede parsear', async () => {
      mockGetReservationByIdUseCase.execute.mockReturnValue(
        of({ ...BASE_RESERVATION, checkIn: 'not-a-date', checkOut: '2026-07-05' }),
      );
      resetRouteParams({}, { reservationId: 'res-bad-date' });

      const { component } = await setup();

      expect(component.reservationSummary().checkIn).toBe('not-a-date');
      expect(component.reservationSummary().checkOut).toBe('05 jul 2026');
    });
  });
});

describe('CheckinComponent - integracion visual (template real)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    paramMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));
    queryParamMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));

    mockGetReservationsUseCase.execute.mockReturnValue(of(paginated([BASE_RESERVATION])));
    mockGetReservationByIdUseCase.execute.mockReturnValue(of(BASE_RESERVATION));
    mockGetGuestReservationByIdUseCase.execute.mockReturnValue(of(undefined));
    mockConfirmReservationUseCase.execute.mockReturnValue(of(undefined));
    mockGuestTokenService.getGuestEmail.mockReturnValue('guest@test.com');
    mockGuestTokenService.getGuestProfile.mockReturnValue({
      email: 'guest@test.com',
      firstName: 'Ana',
      lastName: null,
      fullName: null,
    });
  });

  it('renderiza los datos reales de resumen en la plantilla', async () => {
    mockGetReservationsUseCase.execute.mockReturnValue(
      of(
        paginated([
          {
            ...BASE_RESERVATION,
            guestName: 'Juliana Franco',
            room: 'Suite 302',
            nights: 5,
            guestsCount: 3,
            totalPrice: 5400,
          },
        ]),
      ),
    );

    const { fixture } = await setupWithFullTemplate();
    fixture.detectChanges();

    const panelText = fixture.nativeElement
      .querySelector('.summary-panel')
      .textContent.replace(/\s+/g, ' ')
      .trim();

    expect(panelText).toContain('Juliana Franco');
    expect(panelText).toContain('Suite 302');
    expect(panelText).toContain('Noches: 5');
    expect(panelText).toContain('Huespedes: 3');
    expect(panelText).toContain('Total:');
  });

  it('muestra mensaje de error visual cuando la reservacion por id falla', async () => {
    resetRouteParams({}, { reservationId: 'no-existe' });
    mockGetReservationByIdUseCase.execute.mockReturnValue(
      throwError(() => new Error('not found')),
    );

    const { fixture } = await setupWithFullTemplate();
    fixture.detectChanges();

    const errorNode = fixture.nativeElement.querySelector('.summary-message--error');
    expect(errorNode).toBeTruthy();
    expect(errorNode.textContent).toContain('No se encontro una reservacion para mostrar.');
  });

  it('navega visualmente entre secciones con el boton Siguiente', async () => {
    const { fixture } = await setupWithFullTemplate();
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    );
    const nextButton = buttons.find((button) => button.textContent?.includes('Siguiente')) as
      | HTMLButtonElement
      | undefined;

    expect(nextButton).toBeTruthy();

    nextButton?.click();
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('.panel-head h2')?.textContent?.trim();
    expect(heading).toContain('Sección 2');
  });
});
