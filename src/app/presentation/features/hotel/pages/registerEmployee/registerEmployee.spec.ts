import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { RegisterEmployeeComponent } from './registerEmployee';
import { GetRolesUseCase } from '@/domain/use-cases/staff/get-roles.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { AddStaffUseCase } from '@/domain/use-cases/staff/add-staff.use-case';
import { Role } from '@/domain/entities/staff.model';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_ROLES: Role[] = [
  { id: 'role-1', name: 'Admin', permissions: ['read', 'write', 'delete'] },
  { id: 'role-2', name: 'Receptionist', permissions: ['read', 'write'] },
  { id: 'role-3', name: 'Maintenance', permissions: ['read'] },
];

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('RegisterEmployeeComponent — US-026 (Ver roles del sistema)', () => {
  let fixture: ComponentFixture<RegisterEmployeeComponent>;
  let component: RegisterEmployeeComponent;
  let getRolesMock: ReturnType<typeof vi.fn>;
  let getPropertiesMock: ReturnType<typeof vi.fn>;

  async function setup(getRolesReturn: ReturnType<typeof vi.fn>) {
    getRolesMock = getRolesReturn;
    getPropertiesMock = vi.fn().mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [RegisterEmployeeComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: GetRolesUseCase, useValue: { execute: getRolesMock } },
        { provide: GetPropertiesUseCase, useValue: { execute: getPropertiesMock } },
        { provide: GetUnitsUseCase, useValue: { execute: vi.fn().mockReturnValue(of([])) } },
        { provide: AddStaffUseCase, useValue: { execute: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // dispara ngOnInit
  }

  // ── Error al obtener roles ────────────────────────────────────────────────

  describe('Error al obtener roles del backend', () => {
    beforeEach(async () => {
      await setup(vi.fn().mockReturnValue(throwError(() => new Error('Server error'))));
    });

    it('muestra mensaje de error al fallar la carga de roles', () => {
      expect(component.errorMessage()).toBe('No se pudieron cargar los roles disponibles.');
    });

    it('establece rolesLoading en false tras el error', () => {
      expect(component.rolesLoading()).toBe(false);
    });

    it('availableRoles permanece vacío', () => {
      expect(component.availableRoles()).toEqual([]);
    });

    it('llama al use-case de roles exactamente una vez', () => {
      expect(getRolesMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── Roles obtenidos exitosamente ──────────────────────────────────────────

  describe('Roles obtenidos exitosamente', () => {
    beforeEach(async () => {
      await setup(vi.fn().mockReturnValue(of(MOCK_ROLES)));
    });

    it('almacena los roles en availableRoles', () => {
      expect(component.availableRoles()).toEqual(MOCK_ROLES);
    });

    it('establece rolesLoading en false tras la carga exitosa', () => {
      expect(component.rolesLoading()).toBe(false);
    });

    it('no establece errorMessage cuando la carga es exitosa', () => {
      expect(component.errorMessage()).toBeNull();
    });

    it('cada rol contiene id, name y permissions como arreglo de strings', () => {
      const roles = component.availableRoles();

      roles.forEach((role) => {
        expect(typeof role.id).toBe('string');
        expect(typeof role.name).toBe('string');
        expect(Array.isArray(role.permissions)).toBe(true);
        role.permissions.forEach((p) => expect(typeof p).toBe('string'));
      });
    });

    it('el dropdown tiene tantas opciones como roles retornados', () => {
      expect(component.availableRoles().length).toBe(MOCK_ROLES.length);
    });

    it('los roles contienen los nombres correctos del servidor', () => {
      const names = component.availableRoles().map((r) => r.name);

      expect(names).toContain('Admin');
      expect(names).toContain('Receptionist');
      expect(names).toContain('Maintenance');
    });

    it('llama al use-case de roles exactamente una vez al inicializar', () => {
      expect(getRolesMock).toHaveBeenCalledTimes(1);
    });
  });
});
