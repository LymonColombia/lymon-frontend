import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { InventoryComponent } from './inventory';
import { SupplierRepository } from '@/domain/repositories/supplier.repository';
import { Supplier } from '@/domain/entities/supplier.model';
import { InventoryRepository } from '@/domain/repositories/inventory.repository';
import { InventoryItemResponse } from '@/infrastructure/dtos/inventory.dto';
import { CreateInventoryCategoryUseCase } from '@/domain/use-cases/inventory/create-inventory-category.use-case';
import { CreateInventoryItemUseCase } from '@/domain/use-cases/inventory/create-inventory-item.use-case';
import { GetInventoryCategoriesUseCase } from '@/domain/use-cases/inventory/get-inventory-categories.use-case';
import { GetInventoryItemsUseCase } from '@/domain/use-cases/inventory/get-inventory-items.use-case';
import { AssociateInventorySupplierUseCase } from '@/domain/use-cases/inventory/associate-inventory-supplier.use-case';
import { DeleteInventoryItemUseCase } from '@/domain/use-cases/inventory/delete-inventory-item.use-case';
import { GetSupplierItemsUseCase } from '@/domain/use-cases/supplier/get-supplier-items.use-case';
import { TutorialService } from '@/presentation/shared/services/tutorial.service';
import { ActivatedRoute } from '@angular/router';

const supplierRepositoryMock = {
  createSupplier: vi.fn(),
  updateSupplier: vi.fn(),
  deleteSupplier: vi.fn(),
  getSuppliers: vi.fn().mockReturnValue(of([])),
  getSupplierById: vi.fn(),
  getSupplierItems: vi.fn().mockReturnValue(of([])),
};

const inventoryRepositoryMock = {
  createCategory: vi.fn(),
  createItem: vi.fn(),
  getCategories: vi.fn().mockReturnValue(of([])),
  getItems: vi.fn().mockReturnValue(of([])),
  associateSupplier: vi.fn().mockReturnValue(of(void 0)),
  deleteItem: vi.fn().mockReturnValue(of(void 0)),
};

const activatedRouteMock = {
  snapshot: {
    paramMap: {
      get: vi.fn().mockReturnValue('prop-123'),
    },
  },
};

const tutorialServiceMock = {
  isActive: signal(false),
  requestedInventoryTab: signal<'supplies' | 'providers' | null>(null),
  clearRequestedInventoryTab: vi.fn(),
  resetActionButtonClicked: vi.fn(),
  stepCompleted$: new Subject<void>(),
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
        { provide: TutorialService, useValue: tutorialServiceMock },
        CreateInventoryCategoryUseCase,
        CreateInventoryItemUseCase,
        GetInventoryCategoriesUseCase,
        GetInventoryItemsUseCase,
        AssociateInventorySupplierUseCase,
        DeleteInventoryItemUseCase,
        GetSupplierItemsUseCase,
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
    supplierRepositoryMock.getSuppliers.mockReturnValue(of([createdSupplier]));

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

  it('debe eliminar proveedor y actualizar listado local', () => {
    const providers: Supplier[] = [
      { id: 'sup-1', name: 'Proveedor A', nit: 'NIT-1', city: 'Bogotá', country: 'Colombia', contactEmail: 'a@a.com', contactPhone: '123' },
      { id: 'sup-2', name: 'Proveedor B', nit: 'NIT-2', city: 'Medellín', country: 'Colombia', contactEmail: 'b@b.com', contactPhone: '456' },
    ];
    supplierRepositoryMock.getSuppliers.mockReturnValue(of(providers));
    supplierRepositoryMock.deleteSupplier.mockReturnValue(of(void 0));

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.providers()).toHaveLength(2);

    component.openDeleteProviderModal(component.providers()[0]);
    component.confirmDeleteProvider();

    expect(supplierRepositoryMock.deleteSupplier).toHaveBeenCalledTimes(1);
    expect(supplierRepositoryMock.deleteSupplier).toHaveBeenCalledWith('sup-1');
    expect(component.providers()).toHaveLength(1);
    expect(component.providers()[0].id).toBe('sup-2');
    expect(component.isDeleteProviderModalOpen()).toBe(false);
    expect(component.isDeletingProvider()).toBe(false);
  });

  it('debe desasignar insumos antes de eliminar proveedor con items asociados', () => {
    const provider: Supplier = {
      id: 'sup-1',
      name: 'Proveedor A',
      nit: 'NIT-1',
      city: 'Bogotá',
      country: 'Colombia',
      contactEmail: 'a@a.com',
      contactPhone: '123',
    };
    const items: InventoryItemResponse[] = [
      {
        id: 'item-1',
        sku: 'SKU-001',
        name: 'Insumo 1',
        categoryId: 'cat-1',
        currentStock: 10,
        unit: 'piece',
        minStock: 5,
        lowStock: false,
        supplierId: 'sup-1',
        propertyId: 'prop-123',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ];
    supplierRepositoryMock.getSuppliers.mockReturnValue(of([provider]));
    supplierRepositoryMock.getSupplierItems.mockImplementation((id: string) => of(id === 'sup-1' ? items : []));
    supplierRepositoryMock.deleteSupplier.mockReturnValue(of(void 0));
    inventoryRepositoryMock.associateSupplier.mockReturnValue(of(void 0));

    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.openDeleteProviderModal(component.providers()[0]);
    component.confirmDeleteProvider();

    expect(inventoryRepositoryMock.associateSupplier).toHaveBeenCalledTimes(1);
    expect(inventoryRepositoryMock.associateSupplier).toHaveBeenCalledWith('prop-123', 'item-1', null);
    expect(supplierRepositoryMock.deleteSupplier).toHaveBeenCalledTimes(1);
    expect(supplierRepositoryMock.deleteSupplier).toHaveBeenCalledWith('sup-1');
    expect(component.providers()).toHaveLength(0);
    expect(component.isDeleteProviderModalOpen()).toBe(false);
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
        { provide: TutorialService, useValue: tutorialServiceMock },
        CreateInventoryCategoryUseCase,
        CreateInventoryItemUseCase,
        GetInventoryCategoriesUseCase,
        GetInventoryItemsUseCase,
        AssociateInventorySupplierUseCase,
        DeleteInventoryItemUseCase,
        GetSupplierItemsUseCase,
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
