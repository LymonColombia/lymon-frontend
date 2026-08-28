import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  TenantPageLayoutComponent,
  TenantPageMetaDirective,
} from '@/presentation/tenant/layout/tenant-page-layout/tenant-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { ModalComponent } from '@/presentation/shared/components/modal/modal';
import { BreadcrumbItem } from '@/presentation/shared/components/breadcrumb/breadcrumb';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitUseCase } from '@/domain/use-cases/property/get-unit.use-case';
import { DeleteUnitUseCase } from '@/domain/use-cases/property/delete-unit.use-case';
import { Unit } from '@/domain/entities/staff.model';
import { ROOM_MESSAGES } from '@/domain/constants/room.constants';
import { UnitCardComponent } from './components/unit-card/unit-card';
import { UnitFormModalComponent } from './components/unit-form-modal/unit-form-modal';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapHouseDoorFill,
  bootstrapPlus,
} from '@ng-icons/bootstrap-icons';
import { TutorialService } from '@/presentation/tenant/services/tutorial.service';
import { TutorialHighlightDirective } from '@/presentation/tenant/directives/tutorial-highlight.directive';

@Component({
  selector: 'app-property-units',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TenantPageLayoutComponent,
    TenantPageMetaDirective,
    ButtonComponent,
    ModalComponent,
    UnitCardComponent,
    UnitFormModalComponent,
    NgIcon,
    TutorialHighlightDirective,
  ],
  providers: [provideIcons({ bootstrapHouseDoorFill, bootstrapPlus })],
  templateUrl: './property-units.html',
  styleUrl: './property-units.css',
})
export class PropertyUnitsComponent implements OnInit {
  private static readonly DEFAULT_PROPERTY_NAME = 'Propiedad';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly getUnitsUseCase = inject(GetUnitsUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly getUnitUseCase = inject(GetUnitUseCase);
  private readonly deleteUnitUseCase = inject(DeleteUnitUseCase);
  private readonly tutorialService = inject(TutorialService);

  private unitSaved = false;

  readonly isLoading = signal(true);
  readonly isLoadingEdit = signal(false);
  readonly isDeleting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly propertyId = signal<string | null>(null);
  readonly propertyName = signal<string>(PropertyUnitsComponent.DEFAULT_PROPERTY_NAME);
  readonly propertyType = signal<string | null>(null);
  readonly units = signal<Unit[]>([]);
  readonly showUnitModal = signal(false);
  readonly editingUnit = signal<Unit | null>(null);
  readonly showDeleteConfirm = signal(false);
  readonly unitToDelete = signal<Unit | null>(null);

  readonly breadcrumbItems = computed<readonly BreadcrumbItem[]>(() => [
    { label: 'Propiedades', route: '/admin/properties' },
    { label: this.propertyName() },
  ]);

  ngOnInit(): void {
    const pid = this.route.snapshot.queryParamMap.get('propertyId');
    if (!pid) {
      this.router.navigate(['/admin/properties']);
      return;
    }
    this.propertyId.set(pid);

    this.getPropertiesUseCase.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (props) => {
        const found = props.find((p) => p.id === pid);
        if (found) {
          this.propertyName.set(found.name);
          this.propertyType.set(found.propertyType);
        }
      },
      error: () => { this.errorMessage.set('No se pudo cargar la información de la propiedad.'); },
    });

    this.loadUnits(pid);
  }

  private loadUnits(propertyId: string): void {
    this.isLoading.set(true);
    this.getUnitsUseCase.execute(propertyId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (units) => {
        this.units.set(units);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(ROOM_MESSAGES.loadError);
        this.isLoading.set(false);
      },
    });
  }

  navigateToCreateUnit(): void {
    this.editingUnit.set(null);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.showUnitModal.set(true);
  }

  closeUnitModal(): void {
    this.showUnitModal.set(false);
    this.editingUnit.set(null);
    if (!this.unitSaved) {
      this.tutorialService.resetActionButtonClicked(1);
    }
    this.unitSaved = false;
  }

  openEditUnit(unit: Unit): void {
    this.isLoadingEdit.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.getUnitUseCase
      .execute(unit.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fullUnit) => {
          this.editingUnit.set(fullUnit);
          this.showUnitModal.set(true);
          this.isLoadingEdit.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingEdit.set(false);
          this.errorMessage.set(err.error?.message ?? ROOM_MESSAGES.loadEditError);
        },
      });
  }

  openDeleteConfirm(unit: Unit): void {
    this.unitToDelete.set(unit);
    this.showDeleteConfirm.set(true);
    this.errorMessage.set(null);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.unitToDelete.set(null);
  }

  confirmDelete(): void {
    const unit = this.unitToDelete();
    if (!unit) return;
    this.isDeleting.set(true);
    this.deleteUnitUseCase
      .execute(unit.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.handleDeleteSuccess(),
        error: (err: HttpErrorResponse) => this.handleDeleteError(err),
      });
  }

  private handleDeleteSuccess(): void {
    this.isDeleting.set(false);
    this.showDeleteConfirm.set(false);
    this.unitToDelete.set(null);
    this.successMessage.set(ROOM_MESSAGES.deleteSuccess);
    const currentPropertyId = this.propertyId();
    if (currentPropertyId) this.loadUnits(currentPropertyId);
  }

  private handleDeleteError(err: HttpErrorResponse): void {
    this.isDeleting.set(false);
    this.errorMessage.set(err.error?.message ?? ROOM_MESSAGES.deleteError);
  }

  onUnitSaved(): void {
    const wasEditing = !!this.editingUnit();
    this.unitSaved = !wasEditing;
    this.showUnitModal.set(false);
    this.editingUnit.set(null);
    this.successMessage.set(
      wasEditing ? ROOM_MESSAGES.updateSuccess : ROOM_MESSAGES.createSuccess,
    );
    const currentPropertyId = this.propertyId();
    if (currentPropertyId) this.loadUnits(currentPropertyId);
    if (!wasEditing) {
      this.tutorialService.stepCompleted$.next();
    }
  }
}
