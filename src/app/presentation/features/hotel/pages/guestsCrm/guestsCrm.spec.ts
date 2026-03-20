import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { GuestsCrmComponent } from './guestsCrm';
import { GetCrmGuestsUseCase } from '@/domain/use-cases/crm/get-crm-guests.use-case';
import { GetCrmGuestBookingsUseCase } from '@/domain/use-cases/crm/get-crm-guest-bookings.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';

const mockGetGuests = { execute: vi.fn() };
const mockGetGuestBookings = { execute: vi.fn() };
const mockGetProperties = { execute: vi.fn() };
const mockGetUnits = { execute: vi.fn() };
const mockRouter = { navigate: vi.fn().mockResolvedValue(true) };

const queryParamMap$ = new Subject<ReturnType<typeof convertToParamMap>>();

const MOCK_GUESTS = [
  {
    id: '1',
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+34 612 345 678',
    status: 'active' as const,
  },
  {
    id: '2',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@email.com',
    phone: '+34 623 456 789',
    status: 'active' as const,
  },
  {
    id: '3',
    name: 'Ana Martínez',
    email: 'ana.martinez@email.com',
    phone: '+34 634 567 890',
    status: 'active' as const,
  },
  {
    id: '4',
    name: 'Javier López',
    email: 'javier.lopez@email.com',
    phone: '+34 645 678 901',
    status: 'inactive' as const,
  },
  {
    id: '5',
    name: 'Isabel Fernández',
    email: 'isabel.fernandez@email.com',
    phone: '+34 656 789 012',
    status: 'active' as const,
  },
  {
    id: '6',
    name: 'Daniel Torres',
    email: 'daniel.torres@email.com',
    phone: '+34 667 890 123',
    status: 'active' as const,
  },
  {
    id: '7',
    name: 'Sofía Herrera',
    email: 'sofia.herrera@email.com',
    phone: '+34 678 901 234',
    status: 'inactive' as const,
  },
  {
    id: '8',
    name: 'Luis Navarro',
    email: 'luis.navarro@email.com',
    phone: '+34 689 012 345',
    status: 'active' as const,
  },
];

const MOCK_BOOKINGS = [
  {
    id: 'booking-1',
    propertyId: 'property-1',
    propertyName: '',
    unitId: 'unit-1',
    unitName: '',
    checkIn: '2026-06-01T00:00:00.000Z',
    checkOut: '2026-06-05T00:00:00.000Z',
    status: 'PENDING' as const,
    totalAmount: 2450,
    source: 'MANUAL' as const,
    createdAt: '2026-03-19T18:31:12.492Z',
  },
  {
    id: 'booking-2',
    propertyId: 'property-2',
    propertyName: '',
    unitId: 'unit-2',
    unitName: '',
    checkIn: '2026-06-12T00:00:00.000Z',
    checkOut: '2026-06-14T00:00:00.000Z',
    status: 'CONFIRMED' as const,
    totalAmount: 1200,
    source: 'DIRECT' as const,
    createdAt: '2026-03-20T10:15:00.000Z',
  },
];

const MOCK_PROPERTIES = [
  { id: 'property-1', name: 'Hotel Lymon Centro', propertyType: 'HOTEL', city: 'Bogotá' },
  { id: 'property-2', name: 'Suites Retiro', propertyType: 'HOTEL', city: 'Medellín' },
];

const MOCK_UNITS_BY_PROPERTY: Record<string, Array<{ id: string; name: string }>> = {
  'property-1': [{ id: 'unit-1', name: 'Habitación 204' }],
  'property-2': [{ id: 'unit-2', name: 'Suite 12' }],
};

async function setup() {
  await TestBed.configureTestingModule({
    imports: [GuestsCrmComponent],
    providers: [
      { provide: GetCrmGuestsUseCase, useValue: mockGetGuests },
      { provide: GetCrmGuestBookingsUseCase, useValue: mockGetGuestBookings },
      { provide: GetPropertiesUseCase, useValue: mockGetProperties },
      { provide: GetUnitsUseCase, useValue: mockGetUnits },
      { provide: Router, useValue: mockRouter },
      {
        provide: ActivatedRoute,
        useValue: {
          queryParamMap: queryParamMap$.asObservable(),
          snapshot: { queryParamMap: convertToParamMap({}) },
        },
      },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  })
    .overrideComponent(GuestsCrmComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(GuestsCrmComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  queryParamMap$.next(convertToParamMap({}));
  return { fixture, component };
}

describe('GuestsCrmComponent – carga inicial exitosa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('guests contiene los huéspedes devueltos', async () => {
    const { component } = await setup();
    expect(component.guests().length).toBe(8);
  });

  it('paginatedGuests muestra cinco huéspedes en la primera página', async () => {
    const { component } = await setup();
    expect(component.paginatedGuests().length).toBe(5);
  });

  it('totalPages refleja la cantidad de páginas disponibles', async () => {
    const { component } = await setup();
    expect(component.totalPages()).toBe(2);
  });

  it('isLoading se establece en false', async () => {
    const { component } = await setup();
    expect(component.isLoading()).toBe(false);
  });

  it('no hay mensaje de error', async () => {
    const { component } = await setup();
    expect(component.errorMessage()).toBeNull();
  });
});

describe('GuestsCrmComponent – carga en curso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('isLoading es true mientras el observable no emite', async () => {
    const pending = new Subject<typeof MOCK_GUESTS>();
    mockGetGuests.execute.mockReturnValue(pending.asObservable());
    const { component } = await setup();
    expect(component.isLoading()).toBe(true);
  });
});

describe('GuestsCrmComponent – búsqueda y paginación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('al buscar por nombre reinicia a la primera página y filtra resultados', async () => {
    const { component } = await setup();
    component.goToPage(2);
    component.onSearchTermChange('Ana');

    expect(component.currentPage()).toBe(1);
    expect(component.filteredGuests().length).toBe(1);
    expect(component.filteredGuests()[0].name).toBe('Ana Martínez');
  });

  it('filtra huéspedes por el campo seleccionado', async () => {
    const { component } = await setup();
    component.selectSearchField('email');
    component.onSearchTermChange('luis.navarro');

    expect(component.filteredGuests().length).toBe(1);
    expect(component.filteredGuests()[0].name).toBe('Luis Navarro');
  });

  it('navega entre páginas sin exceder los límites', async () => {
    const { component } = await setup();
    component.goToNextPage();
    expect(component.currentPage()).toBe(2);
    expect(component.paginatedGuests().length).toBe(3);

    component.goToNextPage();
    expect(component.currentPage()).toBe(2);

    component.goToPreviousPage();
    expect(component.currentPage()).toBe(1);
  });
});

describe('GuestsCrmComponent – historial de reservas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockGetGuestBookings.execute.mockReturnValue(of(MOCK_BOOKINGS));
    mockGetProperties.execute.mockReturnValue(of(MOCK_PROPERTIES));
    mockGetUnits.execute.mockImplementation((propertyId: string) =>
      of(MOCK_UNITS_BY_PROPERTY[propertyId] ?? []),
    );
  });

  it('carga las reservas del huésped al abrir el panel', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    expect(mockGetGuestBookings.execute).toHaveBeenCalledWith('1');
    expect(component.guestBookings().length).toBe(2);
    expect(component.isGuestPanelOpen()).toBe(true);
  });

  it('resuelve nombres de propiedad y unidad a partir de los ids', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    expect(component.selectedGuestBookingPreview()[0].propertyLabel).toBe('Hotel Lymon Centro');
    expect(component.selectedGuestBookingPreview()[0].unitLabel).toBe('Habitación 204');
    expect(component.selectedGuestBookingPreview()[1].propertyLabel).toBe('Suites Retiro');
    expect(component.selectedGuestBookingPreview()[1].unitLabel).toBe('Suite 12');
  });

  it('calcula las estadísticas usando las reservas cargadas', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    expect(component.selectedGuestPreview()?.stats[0].value).toBe('2');
    expect(component.selectedGuestPreview()?.stats[1].value).toBe('$3,650');
  });

  it('actualiza el query param al abrir el panel', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { guestId: '1' },
      queryParamsHandling: 'merge',
    });
  });

  it('usa la fecha de creación más reciente para la columna de última reserva', async () => {
    const { component } = await setup();

    expect(component.getLatestReservationLabel(MOCK_GUESTS[0])).toBe('20 mar 2026');
    expect(component.getLatestReservationLabel(MOCK_GUESTS[1])).toBe('20 mar 2026');
  });
});

describe('GuestsCrmComponent – errores en historial de reservas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('muestra mensaje cuando no se encuentran reservas para el huésped', async () => {
    mockGetGuestBookings.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    expect(component.bookingsErrorMessage()).toBe('No se encontraron reservas para este huésped.');
    expect(component.guestBookings()).toEqual([]);
  });

  it('muestra mensaje genérico cuando falla la carga del historial', async () => {
    mockGetGuestBookings.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    expect(component.bookingsErrorMessage()).toBe(
      'No se pudo cargar el historial de reservas. Inténtalo de nuevo.',
    );
  });

  it('muestra N/A en última reserva si el huésped no tiene reservas', async () => {
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    const { component } = await setup();

    expect(component.getLatestReservationLabel(MOCK_GUESTS[0])).toBe('N/A');
  });
});

describe('GuestsCrmComponent – error 403 (acceso denegado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('muestra mensaje de permisos insuficientes', async () => {
    const { component } = await setup();
    expect(component.errorMessage()).toBe('No tienes permisos para ver los huéspedes.');
  });

  it('isLoading vuelve a false', async () => {
    const { component } = await setup();
    expect(component.isLoading()).toBe(false);
  });
});

describe('GuestsCrmComponent – error 401 (sesión expirada)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('muestra mensaje de sesión expirada', async () => {
    const { component } = await setup();
    expect(component.errorMessage()).toBe('Tu sesión expiró. Inicia sesión nuevamente.');
  });

  it('isLoading vuelve a false', async () => {
    const { component } = await setup();
    expect(component.isLoading()).toBe(false);
  });
});

describe('GuestsCrmComponent – error inesperado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('muestra mensaje de error genérico', async () => {
    const { component } = await setup();
    expect(component.errorMessage()).toBe(
      'No se pudo cargar la lista de huéspedes. Inténtalo de nuevo.',
    );
  });
});
