import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { InventoryComponent } from './inventory';
import { SupplierRepository } from '@/domain/repositories/supplier.repository';
import { Supplier } from '@/domain/entities/supplier.model';
import { InventoryRepository } from '@/domain/repositories/inventory.repository';
import { CreateInventoryCategoryUseCase } from '@/domain/use-cases/inventory/create-inventory-category.use-case';
import { CreateInventoryItemUseCase } from '@/domain/use-cases/inventory/create-inventory-item.use-case';
import { ActivatedRoute } from '@angular/router';

const supplierRepositoryMock = {
  createSupplier: vi.fn(),
  updateSupplier: vi.fn(),
  deleteSupplier: vi.fn(),
  getSuppliers: vi.fn().mockReturnValue(of([])),
  getSupplierById: vi.fn(),
};

const inventoryRepositoryMock = {
  createCategory: vi.fn(),
  createItem: vi.fn(),
};

const activatedRouteMock = {
  snapshot: {
    paramMap: {
      get: vi.fn().mockReturnValue('prop-123'),
    },
  },
};

describe('InventoryComponent - suppliers', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: SupplierRepository, useValue: supplierRepositoryMock },
        { provide: InventoryRepository, useValue: inventoryRepositoryMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        CreateInventoryCategoryUseCase,
        CreateInventoryItemUseCase,
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

describe('InventoryComponent - categories', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        { provide: SupplierRepository, useValue: supplierRepositoryMock },
        { provide: InventoryRepository, useValue: inventoryRepositoryMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();
  });

  it('debe crear categoría con payload correcto y cerrar modal', () => {
    const mockCategoryResponse = {
      id: 'cat-1',
      name: 'Amenities',
      description: 'Productos de tocador',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    inventoryRepositoryMock.createCategory.mockReturnValue(of(mockCategoryResponse));

    const fixture = TestBed.createComponent(InventoryComponent);
    const component = fixture.componentInstance;

    component.openCreateCategoryModal();

    component.categoryForm.patchValue({
      name: ' Amenities ',
      description: ' Productos de tocador ',
    });

    component.saveCategory();

    expect(inventoryRepositoryMock.createCategory).toHaveBeenCalledWith({
      name: 'Amenities',
      description: 'Productos de tocador',
    });
    expect(component.isCategoryModalOpen()).toBe(false);
  });

  it('no debe llamar createCategory cuando el formulario es invalido', () => {
    const fixture = TestBed.createComponent(InventoryComponent);
    const component = fixture.componentInstance;

    component.openCreateCategoryModal();
    component.categoryForm.patchValue({
      name: '',
      description: 'short',
    });

    const markTouchedSpy = vi.spyOn(component.categoryForm, 'markAllAsTouched');

    component.saveCategory();

    expect(inventoryRepositoryMock.createCategory).not.toHaveBeenCalled();
    expect(markTouchedSpy).toHaveBeenCalledTimes(1);
  });
});
