import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  HotelPageLayoutComponent,
  HotelPageMetaDirective,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { BreadcrumbItem } from '@/presentation/shared/components/breadcrumb/breadcrumb.component';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { Unit } from '@/domain/entities/staff.model';
import { UnitCardComponent } from './components/unit-card/unit-card.component';
import { UnitFormModalComponent } from './components/unit-form-modal/unit-form-modal.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapHouseDoorFill,
  bootstrapPlus,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-property-units',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    HotelPageLayoutComponent,
    HotelPageMetaDirective,
    ButtonComponent,
    ModalComponent,
    UnitCardComponent,
    UnitFormModalComponent,
    NgIcon,
  ],
  providers: [provideIcons({ bootstrapHouseDoorFill, bootstrapPlus })],
  templateUrl: './propertyUnits.html',
  styleUrl: './propertyUnits.css',
})
export class PropertyUnitsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getUnitsUseCase = inject(GetUnitsUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly propertyId = signal<string | null>(null);
  readonly propertyName = signal<string>('Propiedad');
  readonly propertyType = signal<string | null>(null);
  readonly units = signal<Unit[]>([]);
  readonly showCreateUnitModal = signal(false);

  readonly breadcrumbItems = computed<readonly BreadcrumbItem[]>(() => [
    { label: 'Propiedades', route: '/properties' },
    { label: this.propertyName() },
  ]);

  ngOnInit(): void {
    const pid = this.route.snapshot.queryParamMap.get('propertyId');
    if (!pid) {
      this.router.navigate(['/properties']);
      return;
    }
    this.propertyId.set(pid);

    // Resolve property name
    this.getPropertiesUseCase.execute().subscribe({
      next: (props) => {
        const found = props.find((p) => p.id === pid);
        if (found) {
          this.propertyName.set(found.name);
          this.propertyType.set(found.propertyType);
        }
      },
      error: () => {},
    });

    this.loadUnits(pid);
  }

  private loadUnits(propertyId: string): void {
    this.isLoading.set(true);
    this.getUnitsUseCase.execute(propertyId).subscribe({
      next: (units) => {
        this.units.set(units);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar las unidades. Inténtalo de nuevo.');
        this.isLoading.set(false);
      },
    });
  }

  navigateToCreateUnit(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.showCreateUnitModal.set(true);
  }

  closeCreateUnitModal(): void {
    this.showCreateUnitModal.set(false);
  }

  onUnitCreated(): void {
    this.successMessage.set('Unidad creada correctamente.');
    this.showCreateUnitModal.set(false);

    const currentPropertyId = this.propertyId();
    if (!currentPropertyId) {
      return;
    }

    this.loadUnits(currentPropertyId);
  }
}
