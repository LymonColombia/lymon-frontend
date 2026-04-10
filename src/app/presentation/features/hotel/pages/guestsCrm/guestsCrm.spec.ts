import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { GuestsCrmComponent } from './guestsCrm';
import { CreateCrmGuestNoteUseCase } from '@/domain/use-cases/crm/create-crm-guest-note.use-case';
import { GetCrmGuestsUseCase } from '@/domain/use-cases/crm/get-crm-guests.use-case';
import { GetCrmGuestBookingsUseCase } from '@/domain/use-cases/crm/get-crm-guest-bookings.use-case';
import { GetCrmGuestNotesUseCase } from '@/domain/use-cases/crm/get-crm-guest-notes.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';

const mockGetGuests = { execute: vi.fn() };
const mockCreateGuestNote = { execute: vi.fn() };
const mockGetGuestBookings = { execute: vi.fn() };
const mockGetGuestNotes = { execute: vi.fn() };
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

const MOCK_NOTES = [
  {
    id: 'note-1',
    note: 'Guest requested extra towels',
    type: 'preference' as const,
    status: 'not_pinned' as const,
    createdAt: '2026-03-10T10:00:00.000Z',
    createdByName: 'Admin',
  },
  {
    id: 'note-2',
    note: 'Guest broke a glass in the lobby',
    type: 'incident' as const,
    status: 'pinned' as const,
    createdAt: '2026-03-20T15:00:00.000Z',
    createdByName: 'Staff Member',
  },
  {
    id: 'note-3',
    note: 'Very friendly and polite',
    type: 'general' as const,
    status: 'not_pinned' as const,
    createdAt: '2026-03-15T12:00:00.000Z',
    createdByName: '',
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
      { provide: CreateCrmGuestNoteUseCase, useValue: mockCreateGuestNote },
      { provide: GetCrmGuestBookingsUseCase, useValue: mockGetGuestBookings },
      { provide: GetCrmGuestNotesUseCase, useValue: mockGetGuestNotes },
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
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetGuestNotes.execute.mockReturnValue(of([]));
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
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetGuestNotes.execute.mockReturnValue(of([]));
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
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetGuestNotes.execute.mockReturnValue(of([]));
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
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of(MOCK_BOOKINGS));
    mockGetGuestNotes.execute.mockReturnValue(of([]));
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
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestNotes.execute.mockReturnValue(of([]));
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

describe('GuestsCrmComponent – historial de notas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetGuestNotes.execute.mockReturnValue(of(MOCK_NOTES));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('carga las notas del huésped al abrir el panel', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    expect(mockGetGuestNotes.execute).toHaveBeenCalledWith('1');
    expect(component.guestNotes().length).toBe(3);
  });

  it('ordena las notas de más reciente a más antigua', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    const notes = component.guestNotes();
    expect(notes[0].id).toBe('note-2'); // 2026-03-20
    expect(notes[1].id).toBe('note-3'); // 2026-03-15
    expect(notes[2].id).toBe('note-1'); // 2026-03-10
  });

  it('mapea correctamente las etiquetas de categoría en selectedGuestNotePreview', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    const previews = component.selectedGuestNotePreview();
    const preferenceNote = previews.find((n) => n.id === 'note-1');
    const incidentNote = previews.find((n) => n.id === 'note-2');
    const generalNote = previews.find((n) => n.id === 'note-3');

    expect(preferenceNote?.categoryLabel).toBe('Preferencias');
    expect(incidentNote?.categoryLabel).toBe('Incidente');
    expect(generalNote?.categoryLabel).toBe('General');
  });

  it('usa "Admin" como autor cuando createdByName está vacío', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    const previews = component.selectedGuestNotePreview();
    const generalNote = previews.find((n) => n.id === 'note-3');
    expect(generalNote?.authorLabel).toBe('Admin');
  });

  it('refleja el estado de pin en isPinned del preview', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    const previews = component.selectedGuestNotePreview();
    const pinnedNote = previews.find((n) => n.id === 'note-2');
    const unpinnedNote = previews.find((n) => n.id === 'note-1');

    expect(pinnedNote?.isPinned).toBe(true);
    expect(unpinnedNote?.isPinned).toBe(false);
  });

  it('toggleGuestNotePin alterna el estado de pin de una nota', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    component.toggleGuestNotePin('note-1');
    expect(component.guestNotes().find((n) => n.id === 'note-1')?.status).toBe('pinned');

    component.toggleGuestNotePin('note-1');
    expect(component.guestNotes().find((n) => n.id === 'note-1')?.status).toBe('not_pinned');
  });

  it('toggleGuestNotePin sobre nota ya fijada la desfija', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    component.toggleGuestNotePin('note-2');
    expect(component.guestNotes().find((n) => n.id === 'note-2')?.status).toBe('not_pinned');
  });

  it('no vuelve a cargar las notas si ya están cargadas para el mismo huésped', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    const callCount = mockGetGuestNotes.execute.mock.calls.length;

    component.openGuestPanel(MOCK_GUESTS[0]);
    expect(mockGetGuestNotes.execute.mock.calls.length).toBe(callCount);
  });

  it('closeGuestPanel limpia las notas y el id de notas cargadas', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    expect(component.guestNotes().length).toBe(3);

    component.closeGuestPanel();
    expect(component.guestNotes()).toEqual([]);
    expect(component.loadedGuestNotesGuestId()).toBeNull();
  });

  it('notas vacías cuando la llamada al servidor falla', async () => {
    mockGetGuestNotes.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    expect(component.guestNotes()).toEqual([]);
  });

  it('recarga las notas tras guardar una nueva con forceRefresh', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);

    const callsBefore = mockGetGuestNotes.execute.mock.calls.length;
    component.openGuestNoteForm();
    component.onGuestNoteContentChange('Nueva nota importante');
    component.saveGuestNote();

    expect(mockGetGuestNotes.execute.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(mockGetGuestNotes.execute).toHaveBeenLastCalledWith('1');
  });
});

describe('GuestsCrmComponent – creación de notas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of(MOCK_BOOKINGS));
    mockGetGuestNotes.execute.mockReturnValue(of([]));
    mockGetProperties.execute.mockReturnValue(of(MOCK_PROPERTIES));
    mockGetUnits.execute.mockImplementation((propertyId: string) =>
      of(MOCK_UNITS_BY_PROPERTY[propertyId] ?? []),
    );
  });

  it('abre y cancela el formulario de nota', async () => {
    const { component } = await setup();

    component.openGuestNoteForm();
    expect(component.isGuestNoteFormVisible()).toBe(true);

    component.cancelGuestNoteForm();
    expect(component.isGuestNoteFormVisible()).toBe(false);
    expect(component.guestNoteContent()).toBe('');
    expect(component.guestNoteCategory()).toBe('general');
  });

  it('guarda una nota con el payload esperado', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    component.openGuestNoteForm();
    component.setGuestNoteCategory('incident');
    component.onGuestNoteContentChange('Customer broke a glass in the lobby');

    component.saveGuestNote();

    expect(mockCreateGuestNote.execute).toHaveBeenCalledWith('1', {
      note: 'Customer broke a glass in the lobby',
      type: 'incident',
      status: 'not_pinned',
    });
    expect(component.isGuestNoteFormVisible()).toBe(false);
  });

  it('muestra error si la nota está vacía', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    component.openGuestNoteForm();
    component.onGuestNoteContentChange('   ');

    component.saveGuestNote();

    expect(mockCreateGuestNote.execute).not.toHaveBeenCalled();
    expect(component.guestNoteErrorMessage()).toBe('Escribe una nota antes de guardarla.');
  });

  it('limita el contenido de la nota a 280 caracteres', async () => {
    const { component } = await setup();
    const longText = 'a'.repeat(400);

    component.onGuestNoteContentChange(longText);

    expect(component.guestNoteContent().length).toBe(280);
    expect(component.guestNoteCharacterCount()).toBe(280);
  });

  it('muestra error si falla el guardado de la nota', async () => {
    mockCreateGuestNote.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    component.openGuestNoteForm();
    component.onGuestNoteContentChange('Nota importante del huésped');

    component.saveGuestNote();

    expect(component.guestNoteErrorMessage()).toBe(
      'No se pudo guardar la nota. Inténtalo de nuevo.',
    );
    expect(component.isGuestNoteFormVisible()).toBe(true);
  });
});

describe('GuestsCrmComponent – error 403 (acceso denegado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetGuestNotes.execute.mockReturnValue(of([]));
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
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetGuestNotes.execute.mockReturnValue(of([]));
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
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetGuestNotes.execute.mockReturnValue(of([]));
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

describe('GuestsCrmComponent – cierre del panel de huésped', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of(MOCK_BOOKINGS));
    mockGetProperties.execute.mockReturnValue(of(MOCK_PROPERTIES));
    mockGetUnits.execute.mockImplementation((propertyId: string) =>
      of(MOCK_UNITS_BY_PROPERTY[propertyId] ?? []),
    );
  });

  it('limpia el estado del panel al cerrarlo', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    component.closeGuestPanel();

    expect(component.isGuestPanelOpen()).toBe(false);
    expect(component.guestBookings()).toEqual([]);
    expect(component.bookingsErrorMessage()).toBeNull();
    expect(component.isBookingsLoading()).toBe(false);
  });

  it('restablece el formulario de nota al cerrar el panel', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    component.openGuestNoteForm();
    component.onGuestNoteContentChange('Nota temporal');
    component.closeGuestPanel();

    expect(component.isGuestNoteFormVisible()).toBe(false);
    expect(component.guestNoteContent()).toBe('');
    expect(component.guestNoteCategory()).toBe('general');
  });

  it('navega con guestId null al cerrar el panel', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    vi.clearAllMocks();
    component.closeGuestPanel();

    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { guestId: null },
      queryParamsHandling: 'merge',
    });
  });

  it('no llama al router si el panel ya estaba cerrado', async () => {
    const { component } = await setup();
    vi.clearAllMocks();
    component.closeGuestPanel();

    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});

describe('GuestsCrmComponent – formateo de teléfono', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of([]));
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
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

describe('GuestsCrmComponent – vista previa del panel (casos adicionales)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('muestra "Sin reservas registradas" cuando el huésped no tiene reservas', async () => {
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    expect(component.selectedGuestPreview()?.subtitle).toBe('Sin reservas registradas');
  });

  it('usa el singular cuando el huésped tiene exactamente una reserva', async () => {
    mockGetGuestBookings.execute.mockReturnValue(of([MOCK_BOOKINGS[0]]));
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    expect(component.selectedGuestPreview()?.subtitle).toBe('1 reserva registrada');
  });

  it('muestra "Inactivo" con tono neutral para un huésped inactivo', async () => {
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[3]); // Javier López – inactive
    const statStatus = component.selectedGuestPreview()?.stats[2];
    expect(statStatus?.value).toBe('Inactivo');
    expect(statStatus?.tone).toBe('neutral');
  });

  it('devuelve null cuando no hay huésped seleccionado', async () => {
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    const { component } = await setup();
    expect(component.selectedGuestPreview()).toBeNull();
  });
});

describe('GuestsCrmComponent – etiquetas del huésped seleccionado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('filtra las etiquetas vacías o solo espacios', async () => {
    const guestWithTags = { ...MOCK_GUESTS[0], tags: ['VIP', '', ' ', 'Frecuente'] };
    const { component } = await setup();
    component.openGuestPanel(guestWithTags as (typeof MOCK_GUESTS)[0]);
    expect(component.selectedGuestTags()).toEqual(['VIP', 'Frecuente']);
  });

  it('devuelve un arreglo vacío si el huésped no tiene etiquetas', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    expect(component.selectedGuestTags()).toEqual([]);
  });
});

describe('GuestsCrmComponent – estado de guardado de nota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('isSavingGuestNote es true mientras el observable no emite', async () => {
    const pending = new Subject<void>();
    mockCreateGuestNote.execute.mockReturnValue(pending.asObservable());
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    component.openGuestNoteForm();
    component.onGuestNoteContentChange('Una nota válida');
    component.saveGuestNote();
    expect(component.isSavingGuestNote()).toBe(true);
  });

  it('isSavingGuestNote vuelve a false tras guardar con éxito', async () => {
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    component.openGuestNoteForm();
    component.onGuestNoteContentChange('Una nota válida');
    component.saveGuestNote();
    expect(component.isSavingGuestNote()).toBe(false);
  });

  it('muestra error si no hay huésped seleccionado al guardar', async () => {
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    const { component } = await setup();
    component.openGuestNoteForm();
    component.onGuestNoteContentChange('Una nota válida');
    component.saveGuestNote();

    expect(component.guestNoteErrorMessage()).toBe(
      'No se pudo identificar al huésped para guardar la nota.',
    );
    expect(mockCreateGuestNote.execute).not.toHaveBeenCalled();
  });
});

describe('GuestsCrmComponent – etiquetas de estado de reserva', () => {
  const STATUS_CASES = [
    { status: 'CONFIRMED' as const, expectedLabel: 'Confirmada', expectedTone: 'info' },
    { status: 'CHECKED_IN' as const, expectedLabel: 'Check-in', expectedTone: 'success' },
    { status: 'CHECKED_OUT' as const, expectedLabel: 'Check-out', expectedTone: 'success' },
    { status: 'CANCELLED' as const, expectedLabel: 'Cancelada', expectedTone: 'danger' },
    { status: 'NO_SHOW' as const, expectedLabel: 'No se presentó', expectedTone: 'muted' },
    { status: 'PENDING' as const, expectedLabel: 'Pendiente', expectedTone: 'warning' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  for (const { status, expectedLabel, expectedTone } of STATUS_CASES) {
    it(`muestra "${expectedLabel}" para el estado ${status}`, async () => {
      mockGetGuestBookings.execute.mockReturnValue(of([{ ...MOCK_BOOKINGS[0], status }]));
      const { component } = await setup();
      component.openGuestPanel(MOCK_GUESTS[0]);
      const preview = component.selectedGuestBookingPreview()[0];
      expect(preview.statusLabel).toBe(expectedLabel);
      expect(preview.statusTone).toBe(expectedTone);
    });
  }
});

describe('GuestsCrmComponent – validación de entrada en selectores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('ignora un campo de búsqueda con valor inválido', async () => {
    const { component } = await setup();
    component.selectSearchField('name');
    component.selectSearchField('invalid_field');
    expect(component.searchField()).toBe('name');
  });

  it('ignora una categoría de nota con valor inválido', async () => {
    const { component } = await setup();
    component.setGuestNoteCategory('general');
    component.setGuestNoteCategory('unknown');
    expect(component.guestNoteCategory()).toBe('general');
  });
});

describe('GuestsCrmComponent – caché de reservas del panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of(MOCK_BOOKINGS));
    mockGetProperties.execute.mockReturnValue(of(MOCK_PROPERTIES));
    mockGetUnits.execute.mockImplementation((propertyId: string) =>
      of(MOCK_UNITS_BY_PROPERTY[propertyId] ?? []),
    );
  });

  it('no recarga las reservas si el mismo huésped ya está cargado en el panel', async () => {
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    const callsAfterFirst = mockGetGuestBookings.execute.mock.calls.length;
    component.openGuestPanel(MOCK_GUESTS[0]);
    expect(mockGetGuestBookings.execute.mock.calls.length).toBe(callsAfterFirst);
  });
});

describe('GuestsCrmComponent – sincronización del panel por queryParam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('abre el panel del huésped correcto cuando el queryParam contiene un guestId válido', async () => {
    const { component } = await setup();
    queryParamMap$.next(convertToParamMap({ guestId: '2' }));
    expect(component.selectedGuest()?.id).toBe('2');
    expect(component.isGuestPanelOpen()).toBe(true);
  });

  it('cierra el panel cuando el queryParam guestId desaparece', async () => {
    const { component } = await setup();
    queryParamMap$.next(convertToParamMap({ guestId: '1' }));
    queryParamMap$.next(convertToParamMap({}));
    expect(component.isGuestPanelOpen()).toBe(false);
  });

  it('no abre el panel para un guestId que no existe en la lista', async () => {
    const { component } = await setup();
    queryParamMap$.next(convertToParamMap({ guestId: 'nonexistent' }));
    expect(component.isGuestPanelOpen()).toBe(false);
  });
});

describe('GuestsCrmComponent – placeholder de búsqueda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of([]));
    mockCreateGuestNote.execute.mockReturnValue(of(undefined));
    mockGetGuestBookings.execute.mockReturnValue(of([]));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
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

describe('GuestsCrmComponent – carga de reservas en curso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetGuests.execute.mockReturnValue(of(MOCK_GUESTS));
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('isBookingsLoading es true mientras las reservas no se han cargado', async () => {
    const pending = new Subject<typeof MOCK_BOOKINGS>();
    mockGetGuestBookings.execute.mockReturnValue(pending.asObservable());
    const { component } = await setup();
    component.openGuestPanel(MOCK_GUESTS[0]);
    expect(component.isBookingsLoading()).toBe(true);
  });
});
