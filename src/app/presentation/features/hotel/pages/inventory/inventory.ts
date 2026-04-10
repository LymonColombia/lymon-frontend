import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
} from '@ng-icons/bootstrap-icons';

import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';

type StockState = 'NORMAL' | 'BAJO' | 'CRITICO';

interface SupplyRow {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  provider: string;
  minimumStock: number;
}

interface ProviderRow {
  id: string;
  name: string;
  rif: string;
  address: string;
  contactEmail: string;
  phone: string;
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
    }),
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent {
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<'supplies' | 'providers'>('supplies');
  readonly searchTerm = signal('');
  readonly isSupplyModalOpen = signal(false);
  readonly isProviderModalOpen = signal(false);
  readonly editingSupplyId = signal<string | null>(null);
  readonly editingProviderId = signal<string | null>(null);
  readonly selectedProviderId = signal<string | null>(null);

  readonly categoryOptions: SelectOption[] = [
    { value: 'Textiles', label: 'Textiles' },
    { value: 'Higiene', label: 'Higiene' },
    { value: 'Limpieza', label: 'Limpieza' },
    { value: 'Alimentos', label: 'Alimentos' },
  ];

  readonly unitOptions: SelectOption[] = [
    { value: 'unidades', label: 'unidades' },
    { value: 'litros', label: 'litros' },
    { value: 'kg', label: 'kg' },
    { value: 'cajas', label: 'cajas' },
  ];

  readonly providers = signal<ProviderRow[]>([
    {
      id: 'prov-1',
      name: 'Distribuidora Clean Pro',
      rif: 'J-12345678-9',
      address: 'Av. Principal 123',
      contactEmail: 'ventas@cleanpro.com',
      phone: '+58 212 555-0101',
    },
    {
      id: 'prov-2',
      name: 'Alimentos Frescos CA',
      rif: 'J-98765432-1',
      address: 'Calle Comercio 456',
      contactEmail: 'info@alimentosfrescos.com',
      phone: '+58 212 555-0202',
    },
    {
      id: 'prov-3',
      name: 'Textiles Premium',
      rif: 'J-55544433-2',
      address: 'Zona Industrial 789',
      contactEmail: 'contacto@textilespremium.com',
      phone: '+58 212 555-0303',
    },
  ]);

  readonly supplies = signal<SupplyRow[]>([
    {
      id: 'ins-1',
      name: 'Toallas blancas',
      category: 'Textiles',
      quantity: 250,
      unit: 'unidades',
      provider: 'Textiles Premium',
      minimumStock: 80,
    },
    {
      id: 'ins-2',
      name: 'Jabon liquido',
      category: 'Higiene',
      quantity: 80,
      unit: 'litros',
      provider: 'Distribuidora Clean Pro',
      minimumStock: 20,
    },
    {
      id: 'ins-3',
      name: 'Sabanas king size',
      category: 'Textiles',
      quantity: 120,
      unit: 'unidades',
      provider: 'Textiles Premium',
      minimumStock: 50,
    },
  ]);

  readonly supplyForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: ['Textiles', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    unit: ['unidades', [Validators.required]],
    provider: ['Textiles Premium', [Validators.required]],
    minimumStock: [10, [Validators.required, Validators.min(1)]],
  });

  readonly providerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    rif: ['', [Validators.required]],
    address: ['', [Validators.required]],
    contactEmail: ['', [Validators.email]],
    phone: [''],
  });

  readonly providerOptions = computed<SelectOption[]>(() =>
    this.providers().map((provider) => ({ value: provider.name, label: provider.name })),
  );

  readonly filteredSupplies = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.supplies();
    }

    return this.supplies().filter((item) => {
      return (
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
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
        provider.rif.toLowerCase().includes(term) ||
        provider.contactEmail.toLowerCase().includes(term)
      );
    });
  });

  readonly searchPlaceholder = computed(() => {
    if (this.activeTab() === 'providers') {
      return 'Buscar proveedores por nombre, RIF o email...';
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

  updateSearch(value: string | number | null): void {
    this.searchTerm.set((value ?? '').toString());
  }

  openCreateSupplyModal(): void {
    this.editingSupplyId.set(null);
    this.supplyForm.reset({
      name: '',
      category: 'Textiles',
      quantity: 0,
      unit: 'unidades',
      provider: this.providers()[0]?.name ?? '',
      minimumStock: 10,
    });
    this.isSupplyModalOpen.set(true);
  }

  openEditSupplyModal(supply: SupplyRow): void {
    this.editingSupplyId.set(supply.id);
    this.supplyForm.reset({
      name: supply.name,
      category: supply.category,
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

  saveSupply(): void {
    if (this.supplyForm.invalid) {
      this.supplyForm.markAllAsTouched();
      return;
    }

    const value = this.supplyForm.getRawValue();
    const editingId = this.editingSupplyId();

    if (!editingId) {
      const nextItem: SupplyRow = {
        id: `ins-${Date.now()}`,
        name: value.name.trim(),
        category: value.category,
        quantity: value.quantity,
        unit: value.unit,
        provider: value.provider,
        minimumStock: value.minimumStock,
      };

      this.supplies.update((list) => [nextItem, ...list]);
      this.closeSupplyModal();
      return;
    }

    this.supplies.update((list) =>
      list.map((item) => {
        if (item.id !== editingId) {
          return item;
        }

        return {
          ...item,
          name: value.name.trim(),
          category: value.category,
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

  removeProvider(id: string): void {
    this.providers.update((items) => items.filter((item) => item.id !== id));

    if (this.selectedProviderId() === id) {
      this.selectedProviderId.set(null);
    }

    if (this.editingProviderId() === id) {
      this.closeProviderModal();
    }
  }

  openEditProviderModal(provider: ProviderRow): void {
    this.editingProviderId.set(provider.id);
    this.providerForm.reset({
      name: provider.name,
      rif: provider.rif,
      address: provider.address,
      contactEmail: provider.contactEmail,
      phone: provider.phone,
    });
    this.isProviderModalOpen.set(true);
  }

  openCreateProviderModal(): void {
    this.editingProviderId.set(null);
    this.providerForm.reset({
      name: '',
      rif: '',
      address: '',
      contactEmail: '',
      phone: '',
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
      const nextProvider: ProviderRow = {
        id: `prov-${Date.now()}`,
        name: formValue.name.trim(),
        rif: formValue.rif.trim(),
        address: formValue.address.trim(),
        contactEmail: formValue.contactEmail.trim(),
        phone: formValue.phone.trim(),
      };

      this.providers.update((items) => [nextProvider, ...items]);
      this.closeProviderModal();
      return;
    }

    this.providers.update((items) =>
      items.map((item) => {
        if (item.id !== providerId) {
          return item;
        }

        return {
          ...item,
          rif: formValue.rif.trim(),
          address: formValue.address.trim(),
          contactEmail: formValue.contactEmail.trim(),
          phone: formValue.phone.trim(),
        };
      }),
    );

    this.closeProviderModal();
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

  getCategoryClass(category: string): string {
    return category.toLowerCase().replace(/\s+/g, '-');
  }
}
