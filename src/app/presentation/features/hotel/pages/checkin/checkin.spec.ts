import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, ParamMap, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { CheckinComponent } from './checkin';
import { GetReservationsUseCase } from '@/domain/use-cases/reservation/get-reservations.use-case';
import { GetReservationByIdUseCase } from '@/domain/use-cases/reservation/get-reservation-by-id.use-case';
import { Reservation } from '@/domain/entities/reservation.model';

const mockGetReservationsUseCase = { execute: vi.fn() };
const mockGetReservationByIdUseCase = { execute: vi.fn() };

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

async function setup() {
  const testingModule = TestBed.configureTestingModule({
    imports: [CheckinComponent],
    providers: [
      { provide: GetReservationsUseCase, useValue: mockGetReservationsUseCase },
      { provide: GetReservationByIdUseCase, useValue: mockGetReservationByIdUseCase },
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
    ],
    schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
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
  fixture.detectChanges();

  return { fixture, component };
}

async function setupWithFullTemplate() {
  const testingModule = TestBed.configureTestingModule({
    imports: [CheckinComponent],
    providers: [
      { provide: GetReservationsUseCase, useValue: mockGetReservationsUseCase },
      { provide: GetReservationByIdUseCase, useValue: mockGetReservationByIdUseCase },
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
    ],
    schemas: [NO_ERRORS_SCHEMA],
  });

  testingModule.overrideComponent(CheckinComponent, {
    set: {
      imports: [CommonModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    },
  });

  await testingModule.compileComponents();

  const fixture = TestBed.createComponent(CheckinComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component };
}

describe('CheckinComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    paramMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));
    queryParamMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));

    mockGetReservationsUseCase.execute.mockReturnValue(of([BASE_RESERVATION]));
    mockGetReservationByIdUseCase.execute.mockReturnValue(of(BASE_RESERVATION));
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

    mockGetReservationsUseCase.execute.mockReturnValue(of([finishedReservation, activeReservation]));

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
    const pendingReservations$ = new Subject<Reservation[]>();
    mockGetReservationsUseCase.execute.mockReturnValue(pendingReservations$.asObservable());

    const { component } = await setup();
    expect(component.isLoadingSummary()).toBe(true);

    pendingReservations$.next([BASE_RESERVATION]);
    pendingReservations$.complete();

    expect(component.isLoadingSummary()).toBe(false);
    expect(component.selectedReservation()?.id).toBe('res-1');
  });

  it('actualiza el nombre del archivo de identidad seleccionado', async () => {
    const { component } = await setup();

    const input = document.createElement('input');
    const file = new File(['dummy'], 'documento-identidad.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', {
      value: {
        item: (index: number) => (index === 0 ? file : null),
      },
    });

    component.onIdentityFileSelected({ target: input } as unknown as Event);

    expect(component.selectedIdentityFileName()).toBe('documento-identidad.png');
  });

  it('respeta limites al navegar pasos', async () => {
    const { component } = await setup();

    component.goToPreviousStep();
    expect(component.currentStep()).toBe(1);

    component.goToNextStep();
    component.goToNextStep();
    component.goToNextStep();
    component.goToNextStep();

    expect(component.currentStep()).toBe(4);
    expect(component.isLastStep()).toBe(true);
    expect(component.progressPercent()).toBe(100);
  });

  it('renderiza resumen en la vista con datos de la reservacion', async () => {
    mockGetReservationsUseCase.execute.mockReturnValue(
      of([{ ...BASE_RESERVATION, guestName: 'Ana Perez', room: 'Suite 201', totalPrice: 2400 }]),
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
});

describe('CheckinComponent - integracion visual (template real)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    paramMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));
    queryParamMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));

    mockGetReservationsUseCase.execute.mockReturnValue(of([BASE_RESERVATION]));
    mockGetReservationByIdUseCase.execute.mockReturnValue(of(BASE_RESERVATION));
  });

  it('renderiza los datos reales de resumen en la plantilla', async () => {
    mockGetReservationsUseCase.execute.mockReturnValue(
      of([
        {
          ...BASE_RESERVATION,
          guestName: 'Juliana Franco',
          room: 'Suite 302',
          nights: 5,
          guestsCount: 3,
          totalPrice: 5400,
        },
      ]),
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
    expect(heading).toContain('Seccion 2');
  });
});
