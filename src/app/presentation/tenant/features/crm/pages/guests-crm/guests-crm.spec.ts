import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { GuestsCrmComponent } from './guests-crm';
import { GetCrmGuestsUseCase } from '@/domain/tenant/crm/use-cases/get-crm-guests.use-case';
import { GetCrmGuestBookingsUseCase } from '@/domain/tenant/crm/use-cases/get-crm-guest-bookings.use-case';

const mockGetGuests = { execute: vi.fn() };
const mockGetGuestBookings = { execute: vi.fn() };
const mockRouter = { navigate: vi.fn().mockResolvedValue(true) };

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
    status: 'archived' as const,
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
    status: 'archived' as const,
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

async function setup() {
  await TestBed.configureTestingModule({
    imports: [GuestsCrmComponent],
    providers: [
      { provide: GetCrmGuestsUseCase, useValue: mockGetGuests },
      { provide: GetCrmGuestBookingsUseCase, useValue: mockGetGuestBookings },
      { provide: Router, useValue: mockRouter },
      {
        provide: ActivatedRoute,
        useValue: {
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
  return { fixture, component };
}

// ─── Carga inicial exitosa ────────────────────────────────────────────────────
describe('GuestsCrmComponent – carga inicial exitosa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
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

// ─── Carga en curso ───────────────────────────────────────────────────────────
describe('GuestsCrmComponent – carga en curso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuestBookings.execute.mockReturnValue(of([]));
  });

  it('isLoading es true mientras el observable no emite', async () => {
    const pending = new Subject<typeof MOCK_GUESTS>();
    mockGetGuests.execute.mockReturnValue(pending.asObservable());
    const { component } = await setup();
    expect(component.isLoading()).toBe(true);
  });
});

// ─── Búsqueda y paginación ────────────────────────────────────────────────────
describe('GuestsCrmComponent – búsqueda y paginación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
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

// ─── Última reserva ───────────────────────────────────────────────────────────
describe('GuestsCrmComponent – etiqueta de última reserva', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
  });

  it('devuelve la fecha de creación más reciente del huésped', async () => {
    mockGetGuestBookings.execute.mockReturnValue(of(MOCK_BOOKINGS));
    const { component } = await setup();

    expect(component.getLatestReservationLabel(MOCK_GUESTS[0])).toBe('20 mar 2026');
  });

  it('devuelve N/A cuando el huésped no tiene reservas', async () => {
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    const { component } = await setup();

    expect(component.getLatestReservationLabel(MOCK_GUESTS[0])).toBe('N/A');
  });
});

// ─── Error 403 ────────────────────────────────────────────────────────────────
describe('GuestsCrmComponent – error 403 (acceso denegado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
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

// ─── Error 401 ────────────────────────────────────────────────────────────────
describe('GuestsCrmComponent – error 401 (sesión expirada)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
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

// ─── Error inesperado ─────────────────────────────────────────────────────────
describe('GuestsCrmComponent – error inesperado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
  });

  it('muestra mensaje de error genérico', async () => {
    const { component } = await setup();
    expect(component.errorMessage()).toBe(
      'No se pudo cargar la lista de huéspedes. Inténtalo de nuevo.',
    );
  });
});

// ─── Formateo de teléfono ─────────────────────────────────────────────────────
describe('GuestsCrmComponent – formateo de teléfono', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of([]));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
  });

  it('devuelve el número tal cual si no empieza con +', async () => {
    const { component } = await setup();
    expect(component.formatPhone('3001234567')).toBe('3001234567');
  });

  it('devuelve el número tal cual si ya contiene espacios', async () => {
    const { component } = await setup();
    expect(component.formatPhone('+34 612 345 678')).toBe('+34 612 345 678');
  });

  it('devuelve el número tal cual si tiene 10 o menos dígitos tras el +', async () => {
    const { component } = await setup();
    expect(component.formatPhone('+1234567890')).toBe('+1234567890');
  });

  it('formatea un número con código de país de dos dígitos', async () => {
    const { component } = await setup();
    expect(component.formatPhone('+573001234567')).toBe('+57 3001234567');
  });

  it('formatea un número con código de país de un dígito', async () => {
    const { component } = await setup();
    expect(component.formatPhone('+12025551234')).toBe('+1 2025551234');
  });
});

// ─── Validación de selectores ─────────────────────────────────────────────────
describe('GuestsCrmComponent – validación de entrada en selectores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
  });

  it('ignora un campo de búsqueda con valor inválido', async () => {
    const { component } = await setup();
    component.selectSearchField('name');
    component.selectSearchField('invalid_field');
    expect(component.searchField()).toBe('name');
  });
});

// ─── Ordenación ──────────────────────────────────────────────────────────────
describe('GuestsCrmComponent – ordenación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
  });

  it('estado inicial usa createdAt desc', async () => {
    const { component } = await setup();
    expect(component.sortBy()).toBe('createdAt');
    expect(component.sortDirection()).toBe('desc');
  });

  it('setSort con columna nueva cambia sortBy y resetea dirección a desc', async () => {
    const { component } = await setup();
    component.setSort('fullName');
    expect(component.sortBy()).toBe('fullName');
    expect(component.sortDirection()).toBe('desc');
  });

  it('setSort con misma columna no hace nada', async () => {
    const { component } = await setup();
    mockGetGuests.execute.mockClear();
    component.setSort('createdAt');
    expect(mockGetGuests.execute).not.toHaveBeenCalled();
    expect(component.sortBy()).toBe('createdAt');
  });

  it('setSort resetea la página actual a 1', async () => {
    const { component } = await setup();
    component.goToPage(2);
    component.setSort('status');
    expect(component.currentPage()).toBe(1);
  });

  it('setSort llama al use case con los parámetros de ordenación correctos', async () => {
    const { component } = await setup();
    mockGetGuests.execute.mockClear();
    component.setSort('fullName');
    expect(mockGetGuests.execute).toHaveBeenCalledWith({ sortBy: 'fullName', sortDirection: 'desc' });
  });

  it('carga inicial llama al use case con sortBy y sortDirection', async () => {
    const { component } = await setup();
    expect(mockGetGuests.execute).toHaveBeenCalledWith({ sortBy: 'createdAt', sortDirection: 'desc' });
    expect(component.guests().length).toBe(8);
  });

  it('toggleSortDirection alterna de desc a asc', async () => {
    const { component } = await setup();
    expect(component.sortDirection()).toBe('desc');
    component.toggleSortDirection();
    expect(component.sortDirection()).toBe('asc');
    component.toggleSortDirection();
    expect(component.sortDirection()).toBe('desc');
  });

  it('toggleSortDirection llama al use case con la nueva dirección', async () => {
    const { component } = await setup();
    mockGetGuests.execute.mockClear();
    component.toggleSortDirection();
    expect(mockGetGuests.execute).toHaveBeenCalledWith({ sortBy: 'createdAt', sortDirection: 'asc' });
  });

  it('toggleSortDirection resetea la página actual a 1', async () => {
    const { component } = await setup();
    component.goToPage(2);
    component.toggleSortDirection();
    expect(component.currentPage()).toBe(1);
  });
});

// ─── Placeholder de búsqueda ──────────────────────────────────────────────────
describe('GuestsCrmComponent – placeholder de búsqueda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of([]));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
  });

  it('actualiza el placeholder al cambiar el campo de búsqueda', async () => {
    const { component } = await setup();
    expect(component.searchPlaceholder()).toBe('Buscar por nombre...');
    component.selectSearchField('email');
    expect(component.searchPlaceholder()).toBe('Buscar por correo electrónico...');
    component.selectSearchField('phone');
    expect(component.searchPlaceholder()).toBe('Buscar por teléfono...');
  });
});

// ─── Etiquetas disponibles y traducciones ─────────────────────────────────────
describe('GuestsCrmComponent – etiquetas disponibles y traducciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of([]));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
  });

  it('availableTags contiene exactamente 10 etiquetas', async () => {
    const { component } = await setup();
    expect(component.availableTags.length).toBe(10);
  });

  it('availableTags incluye todas las etiquetas esperadas', async () => {
    const { component } = await setup();
    const expected = [
      'vip', 'family', 'honeymoon', 'business', 'regular',
      'pet friendly', 'accessibility needs', 'loyalty member',
      'early check-in', 'late checkout',
    ];
    expected.forEach((tag) => expect(component.availableTags).toContain(tag));
  });

  it('tagLabels traduce correctamente todas las etiquetas al español', async () => {
    const { component } = await setup();
    expect(component.tagLabels['vip']).toBe('VIP');
    expect(component.tagLabels['family']).toBe('Familia');
    expect(component.tagLabels['honeymoon']).toBe('Luna de miel');
    expect(component.tagLabels['business']).toBe('Negocios');
    expect(component.tagLabels['regular']).toBe('Regular');
    expect(component.tagLabels['pet friendly']).toBe('Mascotas');
    expect(component.tagLabels['accessibility needs']).toBe('Necesidades de accesibilidad');
    expect(component.tagLabels['loyalty member']).toBe('Miembro de fidelidad');
    expect(component.tagLabels['early check-in']).toBe('Check-in temprano');
    expect(component.tagLabels['late checkout']).toBe('Check-out tardío');
  });
});

// ─── Gestión de etiquetas ─────────────────────────────────────────────────────
describe('GuestsCrmComponent – gestión de etiquetas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
  });

  it('toggleTag activa una etiqueta inactiva', async () => {
    const { component } = await setup();
    component.toggleTag('vip');
    expect(component.activeTags()).toContain('vip');
  });

  it('toggleTag desactiva una etiqueta ya activa', async () => {
    const { component } = await setup();
    component.toggleTag('vip');
    component.toggleTag('vip');
    expect(component.activeTags()).not.toContain('vip');
  });

  it('toggleTag puede mantener múltiples etiquetas activas a la vez', async () => {
    const { component } = await setup();
    component.toggleTag('vip');
    component.toggleTag('family');
    expect(component.activeTags()).toEqual(['vip', 'family']);
  });

  it('toggleTag reinicia la página a 1', async () => {
    const { component } = await setup();
    component.goToPage(2);
    component.toggleTag('vip');
    expect(component.currentPage()).toBe(1);
  });

  it('isTagActive devuelve true para una etiqueta activa', async () => {
    const { component } = await setup();
    component.toggleTag('vip');
    expect(component.isTagActive('vip')).toBe(true);
  });

  it('isTagActive devuelve false para una etiqueta inactiva', async () => {
    const { component } = await setup();
    expect(component.isTagActive('vip')).toBe(false);
  });

  it('clearTags elimina todas las etiquetas activas', async () => {
    const { component } = await setup();
    component.toggleTag('vip');
    component.toggleTag('family');
    component.clearTags();
    expect(component.activeTags()).toEqual([]);
  });

  it('clearTags reinicia la página a 1', async () => {
    const { component } = await setup();
    component.toggleTag('vip');
    component.goToPage(2);
    component.clearTags();
    expect(component.currentPage()).toBe(1);
  });
});

// ─── Filtro por estado ────────────────────────────────────────────────────────
describe('GuestsCrmComponent – filtro por estado', () => {
  const GUESTS_WITH_STATUS = [
    { id: '1', name: 'Activo Uno',    email: 'activo1@email.com',   phone: '+1111111111', status: 'active'   as const },
    { id: '2', name: 'Activo Dos',    email: 'activo2@email.com',   phone: '+2222222222', status: 'active'   as const },
    { id: '3', name: 'Activo Tres',   email: 'activo3@email.com',   phone: '+3333333333', status: 'active'   as const },
    { id: '4', name: 'Activo Cuatro', email: 'activo4@email.com',   phone: '+4444444444', status: 'active'   as const },
    { id: '5', name: 'Activo Cinco',  email: 'activo5@email.com',   phone: '+5555555555', status: 'active'   as const },
    { id: '6', name: 'Activo Seis',   email: 'activo6@email.com',   phone: '+6666666666', status: 'active'   as const },
    { id: '7', name: 'Bloqueado Uno', email: 'bloqueado@email.com', phone: '+7777777777', status: 'blocked'  as const },
    { id: '8', name: 'Archivado Uno', email: 'archivado@email.com', phone: '+8888888888', status: 'archived' as const },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(GUESTS_WITH_STATUS));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
  });

  it('sin filtro de estado muestra todos los huéspedes', async () => {
    const { component } = await setup();
    expect(component.filteredGuests().length).toBe(8);
  });

  it('filtra por "active" y muestra solo huéspedes activos', async () => {
    const { component } = await setup();
    component.onStatusFilterChange('active');
    expect(component.filteredGuests().length).toBe(6);
    expect(component.filteredGuests().every((g) => g.status === 'active')).toBe(true);
  });

  it('filtra por "blocked" y muestra solo huéspedes bloqueados', async () => {
    const { component } = await setup();
    component.onStatusFilterChange('blocked');
    expect(component.filteredGuests().length).toBe(1);
    expect(component.filteredGuests()[0].name).toBe('Bloqueado Uno');
  });

  it('filtra por "archived" y muestra solo huéspedes archivados', async () => {
    const { component } = await setup();
    component.onStatusFilterChange('archived');
    expect(component.filteredGuests().length).toBe(1);
    expect(component.filteredGuests()[0].name).toBe('Archivado Uno');
  });

  it('volver a "all" restaura todos los huéspedes', async () => {
    const { component } = await setup();
    component.onStatusFilterChange('blocked');
    component.onStatusFilterChange('all');
    expect(component.filteredGuests().length).toBe(8);
  });

  it('onStatusFilterChange reinicia la página a 1', async () => {
    const { component } = await setup();
    component.goToPage(2);
    component.onStatusFilterChange('active');
    expect(component.currentPage()).toBe(1);
  });
});

// ─── Filtro por etiquetas ─────────────────────────────────────────────────────
describe('GuestsCrmComponent – filtro por etiquetas', () => {
  const GUESTS_WITH_TAGS = [
    { id: '1', name: 'VIP Familia',  email: 'vipfamily@email.com', phone: '+1111111111', status: 'active' as const, tags: ['vip', 'family'] },
    { id: '2', name: 'Solo Familia', email: 'family@email.com',    phone: '+2222222222', status: 'active' as const, tags: ['family'] },
    { id: '3', name: 'Solo Regular', email: 'regular@email.com',   phone: '+3333333333', status: 'active' as const, tags: ['regular'] },
    { id: '4', name: 'Sin Etiquetas', email: 'none@email.com',     phone: '+4444444444', status: 'active' as const, tags: [] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(GUESTS_WITH_TAGS));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
  });

  it('sin etiquetas activas muestra todos los huéspedes', async () => {
    const { component } = await setup();
    expect(component.filteredGuests().length).toBe(4);
  });

  it('al activar "vip" muestra solo huéspedes con esa etiqueta', async () => {
    const { component } = await setup();
    component.toggleTag('vip');
    expect(component.filteredGuests().length).toBe(1);
    expect(component.filteredGuests()[0].name).toBe('VIP Familia');
  });

  it('al activar "family" muestra todos los huéspedes que la contienen', async () => {
    const { component } = await setup();
    component.toggleTag('family');
    expect(component.filteredGuests().length).toBe(2);
  });

  it('al activar "vip" y "family" muestra solo huéspedes con ambas etiquetas', async () => {
    const { component } = await setup();
    component.toggleTag('vip');
    component.toggleTag('family');
    expect(component.filteredGuests().length).toBe(1);
    expect(component.filteredGuests()[0].name).toBe('VIP Familia');
  });

  it('etiqueta sin coincidencias devuelve lista vacía', async () => {
    const { component } = await setup();
    component.toggleTag('honeymoon');
    expect(component.filteredGuests().length).toBe(0);
  });

  it('al desactivar la única etiqueta activa vuelve a mostrar todos los huéspedes', async () => {
    const { component } = await setup();
    component.toggleTag('vip');
    component.toggleTag('vip');
    expect(component.filteredGuests().length).toBe(4);
  });
});
