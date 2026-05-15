import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBoxSeam,
  bootstrapBuilding,
  bootstrapClipboard,
  bootstrapEnvelope,
  bootstrapGeoAlt,
  bootstrapPencilSquare,
  bootstrapPlusLg,
  bootstrapSearch,
  bootstrapTelephone,
  bootstrapX,
  bootstrapXCircleFill,
  bootstrapExclamationTriangle,
  bootstrapCheckCircle,
  bootstrapJustify,
} from '@ng-icons/bootstrap-icons';

import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { SupplierRepository } from '@/domain/repositories/supplier.repository';
import { CreateSupplierDto, UpdateSupplierDto } from '@/infrastructure/dtos/supplier.dto';
import { CreateInventoryItemUseCase } from '@/domain/use-cases/inventory/create-inventory-item.use-case';
import { CreateInventoryCategoryUseCase } from '@/domain/use-cases/inventory/create-inventory-category.use-case';
import { GetInventoryCategoriesUseCase } from '@/domain/use-cases/inventory/get-inventory-categories.use-case';
import { CreateInventoryItemDto, InventoryItemResponse, CreateInventoryCategoryDto, InventoryCategoryResponse } from '@/infrastructure/dtos/inventory.dto';

type StockState = 'NORMAL' | 'BAJO' | 'CRITICO';

interface SupplyRow {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  quantity: number;
  unit: string;
  provider: string;
  minimumStock: number;
}

interface ProviderRow {
  id: string;
  name: string;
  nit: string;
  city: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HotelPageLayoutComponent,
    NgIcon,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    ModalComponent,
  ],
  providers: [
    provideIcons({
      bootstrapBoxSeam,
      bootstrapBuilding,
      bootstrapClipboard,
      bootstrapEnvelope,
      bootstrapGeoAlt,
      bootstrapPencilSquare,
      bootstrapPlusLg,
      bootstrapSearch,
      bootstrapTelephone,
      bootstrapX,
      bootstrapXCircleFill,
      bootstrapExclamationTriangle,
      bootstrapCheckCircle,
      bootstrapJustify,
    }),
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supplierRepository = inject(SupplierRepository);
  private readonly createInventoryItemUseCase = inject(CreateInventoryItemUseCase);
  private readonly createInventoryCategoryUseCase = inject(CreateInventoryCategoryUseCase);
  private readonly getInventoryCategoriesUseCase = inject(GetInventoryCategoriesUseCase);
  private readonly route = inject(ActivatedRoute);

  readonly propertyId = signal<string | null>(null);

  readonly activeTab = signal<'supplies' | 'providers'>('supplies');
  readonly searchTerm = signal('');
  readonly isSupplyModalOpen = signal(false);
  readonly isProviderModalOpen = signal(false);
  readonly isCategoryModalOpen = signal(false);
  readonly editingSupplyId = signal<string | null>(null);
  readonly editingProviderId = signal<string | null>(null);
  readonly selectedProviderId = signal<string | null>(null);
  readonly isDeleteProviderModalOpen = signal(false);
  readonly providerToDelete = signal<ProviderRow | null>(null);
  readonly isSavingProvider = signal(false);
  readonly isSavingSupply = signal(false);
  readonly isSavingCategory = signal(false);
  readonly isCategoriesDropdownOpen = signal(false);
  readonly categories = signal<InventoryCategoryResponse[]>([]);
  readonly notification = signal<{ message: string; type: 'error' | 'success' } | null>(null);
  private notificationTimeout: any;

  readonly categoryOptions = computed<SelectOption[]>(() => {
    return this.categories().map(cat => ({
      value: cat.id,
      label: cat.name
    }));
  });

  readonly unitOptions: SelectOption[] = [
    { value: 'piece', label: 'Unidades' },
    { value: 'liter', label: 'Litros' },
    { value: 'kilogram', label: 'Kilogramos' },
    { value: 'box', label: 'Cajas' },
  ];

  readonly countryOptions: SelectOption[] = [
    { value: 'Colombia', label: 'Colombia' },
    { value: 'Venezuela', label: 'Venezuela' },
    { value: 'Ecuador', label: 'Ecuador' },
    { value: 'Perú', label: 'Perú' },
  ];

  readonly cityOptions: SelectOption[] = [
    { value: 'Bogotá', label: 'Bogotá' },
    { value: 'Medellín', label: 'Medellín' },
    { value: 'Cali', label: 'Cali' },
    { value: 'Barranquilla', label: 'Barranquilla' },
  ];

  readonly providers = signal<ProviderRow[]>([]);

  readonly supplies = signal<SupplyRow[]>([
    {
      id: 'ins-1',
      sku: 'TOA-001',
      name: 'Toallas blancas',
      categoryId: '1',
      categoryName: 'Textiles',
      quantity: 250,
      unit: 'unidades',
      provider: 'Textiles Premium',
      minimumStock: 80,
    },
    {
      id: 'ins-2',
      sku: 'JAB-002',
      name: 'Jabon liquido',
      categoryId: '2',
      categoryName: 'Higiene',
      quantity: 80,
      unit: 'litros',
      provider: 'Distribuidora Clean Pro',
      minimumStock: 20,
    },
    {
      id: 'ins-3',
      sku: 'SAB-003',
      name: 'Sabanas king size',
      categoryId: '1',
      categoryName: 'Textiles',
      quantity: 120,
      unit: 'unidades',
      provider: 'Textiles Premium',
      minimumStock: 50,
    },
  ]);

  readonly supplyForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    categoryId: ['', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    unit: ['piece', [Validators.required]],
    provider: ['Sin proveedor', [Validators.required]],
    minimumStock: [10, [Validators.required, Validators.min(1)]],
  });

  readonly providerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    nit: ['', [Validators.required, Validators.minLength(5)]],
    city: ['Bogotá', [Validators.required]],
    country: ['Colombia', [Validators.required]],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: ['', [Validators.required, Validators.minLength(10)]],
  });

  readonly categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(5)]],
  });

  readonly providerOptions = computed<SelectOption[]>(() => {
    const options = this.providers().map((provider) => ({ value: provider.name, label: provider.name }));
    return [{ value: 'Sin proveedor', label: 'Sin proveedor' }, ...options];
  });

  readonly filteredSupplies = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.supplies();
    }

    return this.supplies().filter((item) => {
      return (
        item.name.toLowerCase().includes(term) ||
        item.categoryName.toLowerCase().includes(term) ||
        item.provider.toLowerCase().includes(term)
      );
    });
  });

  readonly filteredProviders = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.providers();
    }

    return this.providers().filter((provider) => {
      return (
        provider.name.toLowerCase().includes(term) ||
        provider.nit.toLowerCase().includes(term) ||
        provider.contactEmail.toLowerCase().includes(term)
      );
    });
  });

  readonly searchPlaceholder = computed(() => {
    if (this.activeTab() === 'providers') {
      return 'Buscar proveedores por nombre, NIT o email...';
    }

    return 'Buscar insumos por nombre, categoria o proveedor...';
  });

  readonly modalTitle = computed(() =>
    this.editingSupplyId() ? 'Editar Insumo' : 'Agregar Insumo',
  );

  readonly modalSubmitLabel = computed(() =>
    this.editingSupplyId() ? 'Actualizar Insumo' : 'Guardar Insumo',
  );

  readonly providerModalTitle = computed(() =>
    this.editingProviderId() ? 'Editar Proveedor' : 'Agregar Proveedor',
  );

  readonly providerModalSubmitLabel = computed(() =>
    this.editingProviderId() ? 'Actualizar Proveedor' : 'Guardar Proveedor',
  );

  readonly providerNameReadonly = computed(() => Boolean(this.editingProviderId()));

  readonly selectedProvider = computed(() => {
    const providerId = this.selectedProviderId();
    if (!providerId) {
      return null;
    }

    return this.providers().find((provider) => provider.id === providerId) ?? null;
  });

  readonly selectedProviderSupplies = computed(() => {
    const provider = this.selectedProvider();
    if (!provider) {
      return [];
    }

    return this.supplies().filter((item) => item.provider === provider.name);
  });

  setActiveTab(tab: 'supplies' | 'providers'): void {
    this.activeTab.set(tab);
  }

  ngOnInit(): void {
    this.propertyId.set(this.route.snapshot.paramMap.get('propertyId'));
    this.loadProviders();
    this.loadCategories();
  }

  private loadCategories(): void {
    this.getInventoryCategoriesUseCase.execute().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (err) => {
        console.error('Error loading categories', err);
      }
    });
  }

  toggleCategoriesDropdown(): void {
    this.isCategoriesDropdownOpen.update(v => !v);
  }

  private loadProviders(): void {
    this.supplierRepository.getSuppliers().subscribe({
      next: (suppliers) => {
        this.providers.set(suppliers);
      },
      error: (err) => {
        console.error('Error loading suppliers', err);
      }
    });
  }

  updateSearch(value: string | number | null): void {
    this.searchTerm.set((value ?? '').toString());
  }

  openCreateSupplyModal(): void {
    this.editingSupplyId.set(null);
    this.supplyForm.reset({
      name: '',
      categoryId: '',
      quantity: 0,
      unit: 'piece',
      provider: 'Sin proveedor',
      minimumStock: 10,
    });
    this.isSupplyModalOpen.set(true);
  }

  openEditSupplyModal(supply: SupplyRow): void {
    this.editingSupplyId.set(supply.id);
    this.supplyForm.reset({
      name: supply.name,
      categoryId: supply.categoryId,
      quantity: supply.quantity,
      unit: supply.unit,
      provider: supply.provider,
      minimumStock: supply.minimumStock,
    });
    this.isSupplyModalOpen.set(true);
  }

  closeSupplyModal(): void {
    this.isSupplyModalOpen.set(false);
  }

  openCreateCategoryModal(): void {
    this.categoryForm.reset();
    this.isCategoryModalOpen.set(true);
  }

  closeCategoryModal(): void {
    this.isCategoryModalOpen.set(false);
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const value = this.categoryForm.getRawValue();
    const payload: CreateInventoryCategoryDto = {
      name: value.name.trim(),
      description: value.description.trim(),
    };

    this.isSavingCategory.set(true);
    this.createInventoryCategoryUseCase.execute(payload).subscribe({
      next: () => {
        this.isSavingCategory.set(false);
        this.isCategoryModalOpen.set(false);
        this.categoryForm.reset();
        this.showNotification('¡Categoría creada con éxito!', 'success');
        this.loadCategories();
      },
      error: (err) => {
        console.error('Error creating category', err);
        this.isSavingCategory.set(false);
        this.showNotification('Error al crear la categoría. Por favor, intenta de nuevo.', 'error');
      },
    });
  }

  showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    this.notification.set({ message, type });

    this.notificationTimeout = setTimeout(() => {
      this.notification.set(null);
    }, 5000);
  }

  saveSupply(): void {
    if (this.supplyForm.invalid) {
      this.supplyForm.markAllAsTouched();
      return;
    }

    const value = this.supplyForm.getRawValue();
    const editingId = this.editingSupplyId();

    if (!editingId) {
      const propertyId = this.propertyId();
      if (!propertyId) return;

      const prefix = value.name.substring(0, 3).toUpperCase();
      const nextNum = this.supplies().length + 1;
      const generatedSku = `${prefix}-${String(nextNum).padStart(3, '0')}`;

      const payload: CreateInventoryItemDto = {
        sku: generatedSku,
        name: value.name.trim(),
        categoryId: value.categoryId,
        unit: value.unit,
        minStock: value.minimumStock,
        initialStock: value.quantity,
      };

      this.isSavingSupply.set(true);

      const useCase = this.createInventoryItemUseCase;
      const id = String(propertyId);

      useCase.execute(id, payload).subscribe({
        next: (response: InventoryItemResponse) => {
          const categoryName = this.categories().find(c => c.id === response.categoryId)?.name ?? 'Sin categoría';
          const nextItem: SupplyRow = {
            id: response.id,
            sku: response.sku,
            name: response.name,
            categoryId: response.categoryId,
            categoryName: categoryName,
            quantity: response.currentStock,
            unit: value.unit,
            provider: value.provider,
            minimumStock: response.minStock,
          };
          this.supplies.update((list) => [nextItem, ...list]);
          this.isSavingSupply.set(false);
          this.closeSupplyModal();
        },
        error: (err: unknown) => {
          console.error('Error creating supply', err);
          this.isSavingSupply.set(false);
        }
      });
      return;
    }

    this.supplies.update((list) =>
      list.map((item) => {
        if (item.id !== editingId) {
          return item;
        }

        const categoryName = this.categories().find(c => c.id === value.categoryId)?.name ?? 'Sin categoría';
        return {
          ...item,
          name: value.name.trim(),
          categoryId: value.categoryId,
          categoryName: categoryName,
          quantity: value.quantity,
          unit: value.unit,
          provider: value.provider,
          minimumStock: value.minimumStock,
        };
      }),
    );

    this.closeSupplyModal();
  }

  removeSupply(id: string): void {
    this.supplies.update((items) => items.filter((item) => item.id !== id));
  }

  openDeleteProviderModal(provider: ProviderRow): void {
    this.providerToDelete.set(provider);
    this.isDeleteProviderModalOpen.set(true);
  }

  closeDeleteProviderModal(): void {
    this.isDeleteProviderModalOpen.set(false);
    this.providerToDelete.set(null);
  }

  confirmDeleteProvider(): void {
    const provider = this.providerToDelete();
    if (!provider) return;

    this.supplierRepository.deleteSupplier(provider.id).subscribe({
      next: () => {
        this.providers.update((items) => items.filter((item) => item.id !== provider.id));
        this.closeDeleteProviderModal();

        if (this.selectedProviderId() === provider.id) {
          this.selectedProviderId.set(null);
        }
        if (this.editingProviderId() === provider.id) {
          this.closeProviderModal();
        }
      },
      error: (err) => {
        console.error('Error deleting supplier', err);
        this.closeDeleteProviderModal();
      }
    });
  }

  openEditProviderModal(provider: ProviderRow): void {
    this.editingProviderId.set(provider.id);
    this.providerForm.reset({
      name: provider.name,
      nit: provider.nit,
      city: provider.city,
      country: provider.country,
      contactEmail: provider.contactEmail,
      contactPhone: provider.contactPhone,
    });
    this.isProviderModalOpen.set(true);
  }

  openCreateProviderModal(): void {
    this.editingProviderId.set(null);
    this.providerForm.reset({
      name: '',
      nit: '',
      city: 'Bogotá',
      country: 'Colombia',
      contactEmail: '',
      contactPhone: '',
    });
    this.isProviderModalOpen.set(true);
  }

  closeProviderModal(): void {
    this.isProviderModalOpen.set(false);
    this.editingProviderId.set(null);
  }

  saveProvider(): void {
    if (this.providerForm.invalid) {
      this.providerForm.markAllAsTouched();
      return;
    }

    const providerId = this.editingProviderId();
    const formValue = this.providerForm.getRawValue();

    if (!providerId) {
      const payload: CreateSupplierDto = {
        name: formValue.name.trim(),
        nit: formValue.nit.trim(),
        city: formValue.city.trim(),
        country: formValue.country.trim(),
        contactEmail: formValue.contactEmail.trim(),
        contactPhone: formValue.contactPhone.trim(),
      };

      this.isSavingProvider.set(true);
      this.supplierRepository.createSupplier(payload).subscribe({
        next: (createdSupplier) => {
          const nextProvider: ProviderRow = {
            id: createdSupplier.id,
            name: createdSupplier.name,
            nit: createdSupplier.nit,
            city: createdSupplier.city,
            country: createdSupplier.country,
            contactEmail: createdSupplier.contactEmail,
            contactPhone: createdSupplier.contactPhone,
          };
          this.providers.update((items) => [nextProvider, ...items]);
          this.isSavingProvider.set(false);
          this.closeProviderModal();
        },
        error: (err) => {
          console.error('Error creating supplier', err);
          this.isSavingProvider.set(false);
        }
      });
      return;
    }

    const updatePayload: UpdateSupplierDto = {
      supplierId: providerId,
      name: formValue.name.trim(),
      nit: formValue.nit.trim(),
      city: formValue.city.trim(),
      country: formValue.country.trim(),
      contactEmail: formValue.contactEmail.trim(),
      contactPhone: formValue.contactPhone.trim(),
    };

    this.isSavingProvider.set(true);
    this.supplierRepository.updateSupplier(updatePayload).subscribe({
      next: (updatedSupplier) => {
        this.providers.update((items) =>
          items.map((item) => {
            if (item.id !== providerId) {
              return item;
            }

            return {
              ...item,
              city: formValue.city.trim(),
              country: formValue.country.trim(),
              contactEmail: formValue.contactEmail.trim(),
              contactPhone: formValue.contactPhone.trim(),
            };
          }),
        );
        this.isSavingProvider.set(false);
        this.closeProviderModal();
      },
      error: (err) => {
        console.error('Error updating supplier', err);
        this.isSavingProvider.set(false);
      }
    });
  }

  openProviderDetails(providerId: string): void {
    this.selectedProviderId.set(providerId);
  }

  closeProviderDetails(): void {
    this.selectedProviderId.set(null);
  }

  getStockState(item: SupplyRow): StockState {
    if (item.quantity <= item.minimumStock * 0.5) {
      return 'CRITICO';
    }

    if (item.quantity <= item.minimumStock) {
      return 'BAJO';
    }

    return 'NORMAL';
  }

  getStockLabel(item: SupplyRow): string {
    const state = this.getStockState(item);
    if (state === 'CRITICO') return 'Critico';
    if (state === 'BAJO') return 'Bajo';
    return 'Normal';
  }

  getCategoryClass(categoryName: string): string {
    return categoryName.toLowerCase().replace(/\s+/g, '-');
  }
}
