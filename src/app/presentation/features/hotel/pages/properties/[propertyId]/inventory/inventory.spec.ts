import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { InventoryComponent } from './inventory';
import { SupplierRepository } from '@/domain/repositories/supplier.repository';
import { Supplier } from '@/domain/entities/supplier.model';

const supplierRepositoryMock = {
  createSupplier: vi.fn(),
  updateSupplier: vi.fn(),
  deleteSupplier: vi.fn(),
  getSuppliers: vi.fn(),
  getSupplierById: vi.fn(),
};

describe('InventoryComponent - suppliers', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: SupplierRepository, useValue: supplierRepositoryMock },
      ],
    }).compileComponents();
  });

  it('debe crear proveedor con payload correcto y actualizar listado local', () => {
    const createdSupplier: Supplier = {
      id: 'sup-100',
      name: 'Fresh Supplies Inc.',
      nit: 'NIT-123456789',
      city: 'Bogotá',
      country: 'Colombia',
      contactEmail: 'contact@freshsupplies.com',
      contactPhone: '+573001112233',
    };

    supplierRepositoryMock.createSupplier.mockReturnValue(of(createdSupplier));

    const fixture = TestBed.createComponent(InventoryComponent);
    const component = fixture.componentInstance;

    component.openCreateProviderModal();

    component.providerForm.patchValue({
      name: '  Fresh Supplies Inc.  ',
      nit: '  NIT-123456789  ',
      city: ' Bogotá ',
      country: ' Colombia ',
      contactEmail: 'contact@freshsupplies.com',
      contactPhone: '+573001112233',
    });

    const initialCount = component.providers().length;

    component.saveProvider();

    expect(supplierRepositoryMock.createSupplier).toHaveBeenCalledTimes(1);
    expect(supplierRepositoryMock.createSupplier).toHaveBeenCalledWith({
      name: 'Fresh Supplies Inc.',
      nit: 'NIT-123456789',
      city: 'Bogotá',
      country: 'Colombia',
      contactEmail: 'contact@freshsupplies.com',
      contactPhone: '+573001112233',
    });

    expect(component.providers().length).toBe(initialCount + 1);
    expect(component.providers()[0].name).toBe('Fresh Supplies Inc.');
    expect(component.providers()[0].nit).toBe('NIT-123456789');
    expect(component.isProviderModalOpen()).toBe(false);
  });

  it('no debe llamar createSupplier cuando el formulario de proveedor es invalido', () => {
    const fixture = TestBed.createComponent(InventoryComponent);
    const component = fixture.componentInstance;

    component.openCreateProviderModal();
    component.providerForm.patchValue({
      name: '',
      nit: '',
      city: 'Bogotá',
      country: 'Colombia',
      contactEmail: 'email-invalido',
      contactPhone: '',
    });

    const markTouchedSpy = vi.spyOn(component.providerForm, 'markAllAsTouched');

    component.saveProvider();

    expect(supplierRepositoryMock.createSupplier).not.toHaveBeenCalled();
    expect(markTouchedSpy).toHaveBeenCalledTimes(1);
  });
});
