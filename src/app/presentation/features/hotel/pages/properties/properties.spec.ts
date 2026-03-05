import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PropertiesComponent } from './properties';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { CreatePropertyUseCase } from '@/domain/use-cases/property/create-property.use-case';
import { CancellationPolicy, PropertyType } from '@/domain/entities/property.model';

const mockGetProperties = { execute: vi.fn() };
const mockCreateProperty = { execute: vi.fn() };

const MOCK_PROPERTY = {
  id: 'p1',
  name: 'Hotel Demo',
  propertyType: 'HOTEL',
  address: 'Calle 1',
  city: 'Lima',
  state: 'Lima',
  country: 'Perú',
};

const VALID_FORM_VALUES: {
  name: string;
  description: string;
  propertyType: PropertyType;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  lat: number;
  lng: number;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: CancellationPolicy;
  hostPhone: string;
  hostEmail: string;
} = {
  name: 'Hotel Test',
  description: 'Descripción del hotel',
  propertyType: 'HOTEL',
  address: 'Av. Principal 123',
  city: 'Lima',
  state: 'Lima',
  country: 'Perú',
  zipCode: '15001',
  lat: -12.046374,
  lng: -77.042793,
  checkInTime: '14:00',
  checkOutTime: '12:00',
  cancellationPolicy: 'FLEXIBLE',
  hostPhone: '+51999888777',
  hostEmail: 'host@hotel.com',
};

async function setup() {
  await TestBed.configureTestingModule({
    imports: [PropertiesComponent],
    providers: [
      provideRouter([]),
      { provide: GetPropertiesUseCase, useValue: mockGetProperties },
      { provide: CreatePropertyUseCase, useValue: mockCreateProperty },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  })
    .overrideComponent(PropertiesComponent, {
      set: { imports: [ReactiveFormsModule], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(PropertiesComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  const router = TestBed.inject(Router);
  return { fixture, component, router };
}

// ─── Carga inicial exitosa ────────────────────────────────────────────────────
describe('PropertiesComponent – carga inicial exitosa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([MOCK_PROPERTY]));
  });

  it('properties contiene los registros devueltos', async () => {
    const { component } = await setup();
    expect(component.properties().length).toBe(1);
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
describe('PropertiesComponent – carga en curso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('isLoading es true mientras el observable no emite', async () => {
    const pending = new Subject<(typeof MOCK_PROPERTY)[]>();
    mockGetProperties.execute.mockReturnValue(pending.asObservable());
    const { component } = await setup();
    expect(component.isLoading()).toBe(true);
  });
});

// ─── Error al cargar propiedades ──────────────────────────────────────────────
describe('PropertiesComponent – error al cargar propiedades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
  });

  it('muestra mensaje de error de carga', async () => {
    const { component } = await setup();
    expect(component.errorMessage()).toBe('No se pudieron cargar las propiedades.');
  });

  it('isLoading vuelve a false', async () => {
    const { component } = await setup();
    expect(component.isLoading()).toBe(false);
  });
});

// ─── Formulario inválido ─────────────────────────────────────────────────────
describe('PropertiesComponent – formulario inválido', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([]));
  });

  it('no llama a createPropertyUseCase si el formulario está vacío', async () => {
    const { component } = await setup();
    component.onSubmit();
    expect(mockCreateProperty.execute).not.toHaveBeenCalled();
  });

  it('marca todos los campos como tocados', async () => {
    const { component } = await setup();
    const spy = vi.spyOn(component.form, 'markAllAsTouched');
    component.onSubmit();
    expect(spy).toHaveBeenCalled();
  });
});

// ─── Creación exitosa de propiedad ────────────────────────────────────────────
describe('PropertiesComponent – creación exitosa de propiedad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([MOCK_PROPERTY]));
    mockCreateProperty.execute.mockReturnValue(of(undefined));
  });

  it('muestra mensaje de éxito tras crear', async () => {
    const { component } = await setup();
    component.form.patchValue(VALID_FORM_VALUES);
    component.onSubmit();
    expect(component.successMessage()).toBe('Propiedad creada correctamente.');
  });

  it('oculta el formulario tras crear', async () => {
    const { component } = await setup();
    component.form.patchValue(VALID_FORM_VALUES);
    component.showForm.set(true);
    component.onSubmit();
    expect(component.showForm()).toBe(false);
  });

  it('recarga la lista de propiedades tras crear', async () => {
    const { component } = await setup();
    component.form.patchValue(VALID_FORM_VALUES);
    component.onSubmit();
    // ngOnInit + successful submit each call loadProperties
    expect(mockGetProperties.execute).toHaveBeenCalledTimes(2);
  });
});

// ─── Error al crear propiedad ─────────────────────────────────────────────────
describe('PropertiesComponent – error al crear propiedad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([]));
  });

  it('muestra mensaje de error del servidor si está disponible', async () => {
    mockCreateProperty.execute.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 500, error: { message: 'Nombre duplicado' } }),
      ),
    );
    const { component } = await setup();
    component.form.patchValue(VALID_FORM_VALUES);
    component.onSubmit();
    expect(component.errorMessage()).toBe('Nombre duplicado');
  });

  it('muestra mensaje genérico si el servidor no devuelve mensaje', async () => {
    mockCreateProperty.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const { component } = await setup();
    component.form.patchValue(VALID_FORM_VALUES);
    component.onSubmit();
    expect(component.errorMessage()).toBe('Error al crear la propiedad. Inténtalo de nuevo.');
  });
});
