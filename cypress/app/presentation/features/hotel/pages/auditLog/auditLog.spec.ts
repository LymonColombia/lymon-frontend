import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AuditLogComponent } from './auditLog';
import { GetAuditLogsUseCase } from '@/domain/use-cases/audit/get-audit-logs.use-case';

const mockUseCase = { execute: vi.fn() };

const EMPTY_RESULT = { items: [], total: 0 };

async function setup() {
  await TestBed.configureTestingModule({
    imports: [AuditLogComponent],
    providers: [provideRouter([]), { provide: GetAuditLogsUseCase, useValue: mockUseCase }],
    schemas: [NO_ERRORS_SCHEMA],
  })
    .overrideComponent(AuditLogComponent, {
      set: { imports: [ReactiveFormsModule], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(AuditLogComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { fixture, component };
}

// ─── Carga inicial exitosa ────────────────────────────────────────────────────
describe('AuditLogComponent – carga inicial exitosa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(
      of({
        items: [
          {
            id: '1',
            action: 'AUTH_LOGIN',
            entityType: 'AUTH',
            userId: 'u1',
            createdAt: new Date().toISOString(),
            details: {},
          },
          {
            id: '2',
            action: 'PROPERTY_CREATED',
            entityType: 'PROPERTY',
            userId: 'u1',
            createdAt: new Date().toISOString(),
            details: {},
          },
        ],
        total: 2,
      }),
    );
  });

  it('items contiene los registros devueltos', async () => {
    const { component } = await setup();
    expect(component.items().length).toBe(2);
  });

  it('total refleja el valor de la respuesta', async () => {
    const { component } = await setup();
    expect(component.total()).toBe(2);
  });

  it('isLoading se establece en false', async () => {
    const { component } = await setup();
    expect(component.isLoading()).toBe(false);
  });

  it('no hay mensaje de error ni error 403', async () => {
    const { component } = await setup();
    expect(component.errorMessage()).toBeNull();
    expect(component.forbiddenError()).toBe(false);
  });
});

// ─── Carga en curso ──────────────────────────────────────────────────────────
describe('AuditLogComponent – carga en curso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('isLoading es true mientras el observable no emite', async () => {
    const pending = new Subject<typeof EMPTY_RESULT>();
    mockUseCase.execute.mockReturnValue(pending.asObservable());
    const { component } = await setup();
    expect(component.isLoading()).toBe(true);
  });
});

// ─── Error 403 ────────────────────────────────────────────────────────────────
describe('AuditLogComponent – error 403 (acceso denegado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
  });

  it('forbiddenError se establece en true', async () => {
    const { component } = await setup();
    expect(component.forbiddenError()).toBe(true);
  });

  it('isLoading vuelve a false', async () => {
    const { component } = await setup();
    expect(component.isLoading()).toBe(false);
  });
});

// ─── Error 401 ────────────────────────────────────────────────────────────────
describe('AuditLogComponent – error 401 (sesión expirada)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
  });

  it('muestra mensaje de sesión expirada', async () => {
    const { component } = await setup();
    expect(component.errorMessage()).toBe('Tu sesión ha expirado. Vuelve a iniciar sesión.');
  });

  it('isLoading vuelve a false', async () => {
    const { component } = await setup();
    expect(component.isLoading()).toBe(false);
  });
});

// ─── Error inesperado ─────────────────────────────────────────────────────────
describe('AuditLogComponent – error inesperado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
  });

  it('muestra mensaje de error genérico', async () => {
    const { component } = await setup();
    expect(component.errorMessage()).toBe('Error al cargar los registros. Inténtalo de nuevo.');
  });
});
