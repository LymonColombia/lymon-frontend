import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { GuestsCrmComponent } from './guestsCrm';
import { GetCrmGuestsUseCase } from '@/domain/use-cases/crm/get-crm-guests.use-case';

const mockUseCase = { execute: vi.fn() };

const MOCK_GUESTS = [
  {
    id: '1',
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+34 612 345 678',
    lastBooking: '2026-03-15',
    status: 'active' as const,
  },
  {
    id: '2',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@email.com',
    phone: '+34 623 456 789',
    lastBooking: '2026-03-10',
    status: 'active' as const,
  },
  {
    id: '3',
    name: 'Ana Martínez',
    email: 'ana.martinez@email.com',
    phone: '+34 634 567 890',
    lastBooking: '2026-03-08',
    status: 'active' as const,
  },
  {
    id: '4',
    name: 'Javier López',
    email: 'javier.lopez@email.com',
    phone: '+34 645 678 901',
    lastBooking: '2026-03-05',
    status: 'inactive' as const,
  },
  {
    id: '5',
    name: 'Isabel Fernández',
    email: 'isabel.fernandez@email.com',
    phone: '+34 656 789 012',
    lastBooking: '2026-03-01',
    status: 'active' as const,
  },
  {
    id: '6',
    name: 'Daniel Torres',
    email: 'daniel.torres@email.com',
    phone: '+34 667 890 123',
    lastBooking: '2026-02-28',
    status: 'active' as const,
  },
  {
    id: '7',
    name: 'Sofía Herrera',
    email: 'sofia.herrera@email.com',
    phone: '+34 678 901 234',
    lastBooking: '2026-02-23',
    status: 'inactive' as const,
  },
  {
    id: '8',
    name: 'Luis Navarro',
    email: 'luis.navarro@email.com',
    phone: '+34 689 012 345',
    lastBooking: '2026-02-18',
    status: 'active' as const,
  },
];

async function setup() {
  await TestBed.configureTestingModule({
    imports: [GuestsCrmComponent],
    providers: [{ provide: GetCrmGuestsUseCase, useValue: mockUseCase }],
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
    mockUseCase.execute.mockReturnValue(of(MOCK_GUESTS));
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

// ─── Carga en curso ──────────────────────────────────────────────────────────
describe('GuestsCrmComponent – carga en curso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('isLoading es true mientras el observable no emite', async () => {
    const pending = new Subject<typeof MOCK_GUESTS>();
    mockUseCase.execute.mockReturnValue(pending.asObservable());
    const { component } = await setup();
    expect(component.isLoading()).toBe(true);
  });
});

// ─── Búsqueda y paginación ───────────────────────────────────────────────────
describe('GuestsCrmComponent – búsqueda y paginación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(of(MOCK_GUESTS));
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

// ─── Error 403 ────────────────────────────────────────────────────────────────
describe('GuestsCrmComponent – error 403 (acceso denegado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
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
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
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
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
  });

  it('muestra mensaje de error genérico', async () => {
    const { component } = await setup();
    expect(component.errorMessage()).toBe(
      'No se pudo cargar la lista de huéspedes. Inténtalo de nuevo.',
    );
  });
});
