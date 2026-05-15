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
import { CreateInventoryItemDto, InventoryItemResponse, CreateInventoryCategoryDto, InventoryCategoryResponse, InventoryItemListResponse } from '@/infrastructure/dtos/inventory.dto';
import { GetInventoryItemsUseCase } from '@/domain/use-cases/inventory/get-inventory-items.use-case';

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
  lowStock: boolean;
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
  private readonly getInventoryItemsUseCase = inject(GetInventoryItemsUseCase);
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


  readonly currentPage = signal(1);
  readonly pageSize = 10;

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

  readonly rawSupplies = signal<InventoryItemResponse[]>([]);
  readonly mappedSupplies = computed(() => this.rawSupplies().map(item => this.mapToSupplyRow(item)));

  private readonly unitTranslations: Record<string, string> = {
    'piece': 'unidad',
    'liter': 'litro',
    'kilogram': 'kilogramo',
    'box': 'caja',
    'unit': 'unidad',
    'unidades': 'unidad',
    'litros': 'litro'
  };

  readonly supplyForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    categoryId: ['', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    unit: ['piece', [Validators.required]],
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
    const supplies = this.mappedSupplies();
    if (!term) return supplies;

    return supplies.filter((item) => {
      return (
        item.name.toLowerCase().includes(term) ||
        item.categoryName.toLowerCase().includes(term) ||
        item.provider.toLowerCase().includes(term)
      );
    });
  });

  readonly paginatedSupplies = computed(() => {
    const supplies = this.filteredSupplies();
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return supplies.slice(start, end);
  });

  readonly totalSuppliesPages = computed(() => {
    return Math.ceil(this.filteredSupplies().length / this.pageSize) || 1;
  });

  readonly filteredProviders = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const providers = this.providers();
    if (!term) return providers;

    return providers.filter((provider) => {
      return (
        provider.name.toLowerCase().includes(term) ||
        provider.nit.toLowerCase().includes(term) ||
        provider.contactEmail.toLowerCase().includes(term)
      );
    });
  });

  readonly paginatedProviders = computed(() => {
    const providers = this.filteredProviders();
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return providers.slice(start, end);
  });

  readonly totalProvidersPages = computed(() => {
    return Math.ceil(this.filteredProviders().length / this.pageSize) || 1;
  });

  readonly totalPages = computed(() => {
    return this.activeTab() === 'supplies' ? this.totalSuppliesPages() : this.totalProvidersPages();
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

    return this.mappedSupplies().filter((item) => item.provider === provider.name);
  });

  setActiveTab(tab: 'supplies' | 'providers'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  ngOnInit(): void {
    const propertyId = this.route.snapshot.paramMap.get('propertyId');
    this.propertyId.set(propertyId);
    this.loadProviders();
    this.loadCategories();
    if (propertyId) {
      this.loadSupplies(propertyId);
    }
  }

  private loadSupplies(propertyId: string): void {
    this.getInventoryItemsUseCase.execute(propertyId).subscribe({
      next: (items) => {
        this.rawSupplies.set(items);
      },
      error: (err) => {
        console.error('Error loading supplies', err);
      }
    });
  }

  private mapToSupplyRow(item: InventoryItemResponse): SupplyRow {
    const category = this.categories().find(c => c.id === item.categoryId);
    return {
      id: item.id,
      sku: item.sku || 'PENDIENTE',
      name: this.toSentenceCase(item.name || 'Insumo sin nombre'),
      categoryId: item.categoryId,
      categoryName: category ? this.toSentenceCase(category.name) : 'General',
      quantity: item.currentStock,
      unit: item.unit,
      provider: 'Proveedor no asignado',
      minimumStock: item.minStock,
      lowStock: item.lowStock
    };
  }

  private toSentenceCase(text: string): string {
    if (!text) return '';
    const lower = text.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  getFormattedUnit(unit: string, quantity: number): string {
    const translated = this.unitTranslations[unit.toLowerCase()] || unit;
    let pluralized = translated;
    
    if (quantity !== 1) {
      if (translated === 'unidad') pluralized = 'unidades';
      else if (translated === 'litro') pluralized = 'litros';
      else if (translated === 'kilogramo') pluralized = 'kilogramos';
      else if (translated === 'caja') pluralized = 'cajas';
      else pluralized = `${translated}s`;
    }
    
    return `${quantity} ${pluralized.toLowerCase()}`;
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
    this.currentPage.set(1);
  }

  openCreateSupplyModal(): void {
    this.editingSupplyId.set(null);
    this.supplyForm.reset({
      name: '',
      categoryId: '',
      quantity: 0,
      unit: 'piece',
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
      const nextNum = this.rawSupplies().length + 1;
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
        next: () => {
          this.isSavingSupply.set(false);
          this.showNotification('¡Insumo creado con éxito!', 'success');
          this.closeSupplyModal();
          this.supplyForm.reset();
          
          this.loadSupplies(id);
        },
        error: (err: unknown) => {
          console.error('Error creating supply', err);
          this.isSavingSupply.set(false);
          this.showNotification('Error al crear el insumo. Por favor, intenta de nuevo.', 'error');
        }
      });
      return;
    }

    this.rawSupplies.update((list) =>
      list.map((item) => {
        if (item.id !== editingId) {
          return item;
        }

        return {
          ...item,
          name: value.name.trim(),
          categoryId: value.categoryId,
          currentStock: value.quantity,
          unit: value.unit,
          minStock: value.minimumStock,
        };
      }),
    );

    this.closeSupplyModal();
  }

  removeSupply(id: string): void {
    this.rawSupplies.update((items) => items.filter((item) => item.id !== id));
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
        next: () => {
          this.isSavingProvider.set(false);
          this.showNotification('¡Proveedor agregado con éxito!', 'success');
          this.closeProviderModal();
          this.providerForm.reset();
          
          this.loadProviders();
        },
        error: (err) => {
          console.error('Error creating supplier', err);
          this.isSavingProvider.set(false);
          this.showNotification('Error al agregar el proveedor. Por favor, intenta de nuevo.', 'error');
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
      next: () => {
        this.isSavingProvider.set(false);
        this.showNotification('¡Proveedor actualizado con éxito!', 'success');
        this.closeProviderModal();
        
        this.loadProviders();
      },
      error: (err) => {
        console.error('Error updating supplier', err);
        this.isSavingProvider.set(false);
        this.showNotification('Error al actualizar el proveedor. Por favor, intenta de nuevo.', 'error');
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
    if (item.quantity === 0 || item.quantity <= item.minimumStock * 0.15) {
      return 'CRITICO';
    }

    if (item.quantity < item.minimumStock) {
      return 'BAJO';
    }

    return 'NORMAL';
  }

  getStockLabel(item: SupplyRow): string {
    const state = this.getStockState(item);
    if (state === 'CRITICO') return 'Crítico';
    if (state === 'BAJO') return 'Bajo';
    return 'Normal';
  }

  getCategoryClass(categoryName: string): string {
    return categoryName.toLowerCase().replace(/\s+/g, '-');
  }
}
