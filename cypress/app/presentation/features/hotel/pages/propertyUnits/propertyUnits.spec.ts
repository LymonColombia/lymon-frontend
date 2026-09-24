import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PropertyUnitsComponent } from './propertyUnits';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';

const mockGetUnits = { execute: vi.fn() };
const mockGetProperties = { execute: vi.fn() };

const MOCK_PROPERTY = { id: 'p1', name: 'Hotel Demo', propertyType: 'HOTEL' };
const MOCK_UNITS = [
  { id: 'u1', name: 'Habitación 1' },
  { id: 'u2', name: 'Habitación 2' },
];

function activatedRouteStub(propertyId: string | null) {
  return {
    snapshot: {
      queryParamMap: convertToParamMap(propertyId ? { propertyId } : {}),
    },
  };
}

async function setup(pid: string | null = 'p1') {
  await TestBed.configureTestingModule({
    imports: [PropertyUnitsComponent],
    providers: [
      provideRouter([]),
      { provide: GetUnitsUseCase, useValue: mockGetUnits },
      { provide: GetPropertiesUseCase, useValue: mockGetProperties },
      { provide: ActivatedRoute, useValue: activatedRouteStub(pid) },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  })
    .overrideComponent(PropertyUnitsComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(PropertyUnitsComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  const router = TestBed.inject(Router);
  return { fixture, component, router };
}

// ─── Sin propertyId en la URL ─────────────────────────────────────────────────
describe('PropertyUnitsComponent – sin propertyId en URL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('navega a /properties si no hay propertyId', async () => {
    const { router } = await setup(null);
    const navigateSpy = vi.spyOn(router, 'navigate');
    // ngOnInit already ran during fixture.detectChanges(); spy after the fact
    // Re-trigger to capture: use a new component
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    mockGetProperties.execute.mockReturnValue(of([]));
    mockGetUnits.execute.mockReturnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [PropertyUnitsComponent],
      providers: [
        provideRouter([]),
        { provide: GetUnitsUseCase, useValue: mockGetUnits },
        { provide: GetPropertiesUseCase, useValue: mockGetProperties },
        { provide: ActivatedRoute, useValue: activatedRouteStub(null) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(PropertyUnitsComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
    const router2 = TestBed.inject(Router);
    const spy = vi.spyOn(router2, 'navigate');
    const fixture2 = TestBed.createComponent(PropertyUnitsComponent);
    fixture2.detectChanges();
    expect(spy).toHaveBeenCalledWith(['/properties']);
  });
});

// ─── Carga exitosa de unidades ────────────────────────────────────────────────
describe('PropertyUnitsComponent – carga exitosa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([MOCK_PROPERTY]));
    mockGetUnits.execute.mockReturnValue(of(MOCK_UNITS));
  });

  it('units contiene las unidades devueltas', async () => {
    const { component } = await setup('p1');
    expect(component.units().length).toBe(2);
  });

  it('isLoading se establece en false', async () => {
    const { component } = await setup('p1');
    expect(component.isLoading()).toBe(false);
  });

  it('propertyName se actualiza con el nombre de la propiedad', async () => {
    const { component } = await setup('p1');
    expect(component.propertyName()).toBe('Hotel Demo');
  });

  it('propertyType se actualiza con el tipo de propiedad', async () => {
    const { component } = await setup('p1');
    expect(component.propertyType()).toBe('HOTEL');
  });

  it('no hay mensaje de error', async () => {
    const { component } = await setup('p1');
    expect(component.errorMessage()).toBeNull();
  });
});

// ─── Propiedad no encontrada ──────────────────────────────────────────────────
describe('PropertyUnitsComponent – propiedad no encontrada en la lista', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    // getProperties returns properties that don't match pid
    mockGetProperties.execute.mockReturnValue(of([{ ...MOCK_PROPERTY, id: 'other' }]));
    mockGetUnits.execute.mockReturnValue(of([]));
  });

  it('mantiene el nombre por defecto "Propiedad"', async () => {
    const { component } = await setup('p1');
    expect(component.propertyName()).toBe('Propiedad');
  });

  it('propertyType permanece null', async () => {
    const { component } = await setup('p1');
    expect(component.propertyType()).toBeNull();
  });
});

// ─── Carga en curso ──────────────────────────────────────────────────────────
describe('PropertyUnitsComponent – carga en curso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('isLoading es true mientras el observable no emite', async () => {
    const pending = new Subject<typeof MOCK_UNITS>();
    mockGetProperties.execute.mockReturnValue(of([MOCK_PROPERTY]));
    mockGetUnits.execute.mockReturnValue(pending.asObservable());
    const { component } = await setup('p1');
    expect(component.isLoading()).toBe(true);
  });
});

// ─── Error al cargar unidades ─────────────────────────────────────────────────
describe('PropertyUnitsComponent – error al cargar unidades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([MOCK_PROPERTY]));
    mockGetUnits.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
  });

  it('muestra mensaje de error de carga', async () => {
    const { component } = await setup('p1');
    expect(component.errorMessage()).toBe(
      'No se pudieron cargar las unidades. Inténtalo de nuevo.',
    );
  });

  it('isLoading vuelve a false', async () => {
    const { component } = await setup('p1');
    expect(component.isLoading()).toBe(false);
  });
});
