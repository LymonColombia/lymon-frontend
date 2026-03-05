import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CreateRoomComponent } from './createRoom';
import { CreateUnitUseCase } from '@/domain/use-cases/property/create-unit.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';

const mockCreateUnit = { execute: vi.fn() };
const mockGetProperties = { execute: vi.fn() };

const MOCK_PROPERTY = { id: 'p1', name: 'Hotel Demo', propertyType: 'HOTEL' };

function activatedRouteStub(propertyId: string | null) {
  return {
    snapshot: {
      queryParamMap: convertToParamMap(propertyId ? { propertyId } : {}),
    },
  };
}

async function setup(pid: string | null = 'p1') {
  await TestBed.configureTestingModule({
    imports: [CreateRoomComponent],
    providers: [
      provideRouter([]),
      { provide: CreateUnitUseCase, useValue: mockCreateUnit },
      { provide: GetPropertiesUseCase, useValue: mockGetProperties },
      { provide: ActivatedRoute, useValue: activatedRouteStub(pid) },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  })
    .overrideComponent(CreateRoomComponent, {
      set: { imports: [ReactiveFormsModule], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(CreateRoomComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  const router = TestBed.inject(Router);
  return { fixture, component, router };
}

function fillValidForm(component: CreateRoomComponent) {
  component.form.patchValue({
    name: 'Suite Deluxe',
    description: 'Habitación con vista al mar',
    inventoryCount: 3,
    maxGuests: 2,
    standardGuests: 1,
    bathroomsCount: 1,
    isShared: false,
    pricePerNight: 150,
  });
  // Fill the required bedroom roomName
  const bedroom = component.form.controls.bedrooms.at(0);
  bedroom.patchValue({ roomName: 'Dormitorio 1' });
}

// ─── Sin propertyId en URL ────────────────────────────────────────────────────
describe('CreateRoomComponent – sin propertyId en URL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([]));
  });

  it('navega a /properties si no hay propertyId', async () => {
    await TestBed.configureTestingModule({
      imports: [CreateRoomComponent],
      providers: [
        provideRouter([]),
        { provide: CreateUnitUseCase, useValue: mockCreateUnit },
        { provide: GetPropertiesUseCase, useValue: mockGetProperties },
        { provide: ActivatedRoute, useValue: activatedRouteStub(null) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(CreateRoomComponent, {
        set: { imports: [ReactiveFormsModule], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(CreateRoomComponent);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(['/properties']);
  });
});

// ─── ngOnInit con propertyId válido ──────────────────────────────────────────
describe('CreateRoomComponent – ngOnInit con propertyId válido', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([MOCK_PROPERTY]));
  });

  it('guarda el propertyId en la señal', async () => {
    const { component } = await setup('p1');
    expect(component.propertyId()).toBe('p1');
  });

  it('establece el nombre de la propiedad al cargar', async () => {
    const { component } = await setup('p1');
    expect(component.propertyName()).toBe('Hotel Demo');
  });

  it('propertyName es null cuando la propiedad no está en la lista', async () => {
    mockGetProperties.execute.mockReturnValue(of([{ ...MOCK_PROPERTY, id: 'other' }]));
    const { component } = await setup('p1');
    expect(component.propertyName()).toBeNull();
  });
});

// ─── Formulario inválido ─────────────────────────────────────────────────────
describe('CreateRoomComponent – formulario inválido', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([MOCK_PROPERTY]));
  });

  it('no llama al use-case si el formulario está vacío', async () => {
    const { component } = await setup('p1');
    component.form.reset();
    component.onSubmit();
    expect(mockCreateUnit.execute).not.toHaveBeenCalled();
  });

  it('marca todos los campos como tocados', async () => {
    const { component } = await setup('p1');
    component.form.reset();
    const spy = vi.spyOn(component.form, 'markAllAsTouched');
    component.onSubmit();
    expect(spy).toHaveBeenCalled();
  });
});

// ─── Creación exitosa de unidad ───────────────────────────────────────────────
describe('CreateRoomComponent – creación exitosa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([MOCK_PROPERTY]));
    mockCreateUnit.execute.mockReturnValue(of(undefined));
  });

  it('muestra mensaje de éxito tras crear', async () => {
    const { component } = await setup('p1');
    fillValidForm(component);
    component.onSubmit();
    expect(component.successMessage()).toBe('Unidad creada correctamente.');
  });

  it('isLoading vuelve a false tras el éxito', async () => {
    const { component } = await setup('p1');
    fillValidForm(component);
    component.onSubmit();
    expect(component.isLoading()).toBe(false);
  });

  it('limpia las amenidades seleccionadas tras crear', async () => {
    const { component } = await setup('p1');
    component.toggleAmenity('WiFi');
    fillValidForm(component);
    component.onSubmit();
    expect(component.selectedAmenities().size).toBe(0);
  });
});

// ─── Carga en curso ──────────────────────────────────────────────────────────
describe('CreateRoomComponent – carga en curso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([MOCK_PROPERTY]));
  });

  it('isLoading es true mientras el observable no emite', async () => {
    const pending = new Subject<void>();
    mockCreateUnit.execute.mockReturnValue(pending.asObservable());
    const { component } = await setup('p1');
    fillValidForm(component);
    component.onSubmit();
    expect(component.isLoading()).toBe(true);
  });
});

// ─── Error al crear unidad ─────────────────────────────────────────────────────
describe('CreateRoomComponent – error al crear unidad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([MOCK_PROPERTY]));
  });

  it('muestra mensaje de error del servidor si está disponible', async () => {
    mockCreateUnit.execute.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 409, error: { message: 'Nombre duplicado' } }),
      ),
    );
    const { component } = await setup('p1');
    fillValidForm(component);
    component.onSubmit();
    expect(component.errorMessage()).toBe('Nombre duplicado');
  });

  it('muestra mensaje genérico si el servidor no devuelve mensaje', async () => {
    mockCreateUnit.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const { component } = await setup('p1');
    fillValidForm(component);
    component.onSubmit();
    expect(component.errorMessage()).toBe('Error al crear la unidad. Inténtalo de nuevo.');
  });
});

// ─── onCancel ─────────────────────────────────────────────────────────────────
describe('CreateRoomComponent – onCancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([MOCK_PROPERTY]));
  });

  it('navega a /property-units con el propertyId correcto', async () => {
    const { component, router } = await setup('p1');
    const spy = vi.spyOn(router, 'navigate');
    component.onCancel();
    expect(spy).toHaveBeenCalledWith(['/property-units'], { queryParams: { propertyId: 'p1' } });
  });
});
