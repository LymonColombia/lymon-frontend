import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TenantPageLayoutComponent } from '@/presentation/tenant/layout/tenant-page-layout/tenant-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { CreateIncidentReportUseCase } from '@/domain/tenant/incident-report/use-cases/create-incident-report.use-case';
import { GetPropertiesUseCase } from '@/domain/shared/property/use-cases/get-properties.use-case';
import { Property } from '@/domain/shared/property/property.model';

@Component({
  selector: 'app-create-incident-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TenantPageLayoutComponent,
    ButtonComponent,
  ],
  templateUrl: './create-incident-report.html',
  styleUrl: './create-incident-report.css',
})
export class CreateIncidentReportComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly createIncidentReportUseCase = inject(CreateIncidentReportUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly isLoadingProperties = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly properties = signal<Property[]>([]);

  /** True once the property list has resolved to nothing usable. */
  readonly hasNoProperties = computed(
    () => !this.isLoadingProperties() && this.properties().length === 0,
  );

  readonly form = this.fb.group({
    propertyId: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnInit(): void {
    this.loadProperties();
  }

  private loadProperties(): void {
    this.isLoadingProperties.set(true);
    // Clear any prior selection so a reload never keeps a stale property id.
    this.properties.set([]);
    this.propertyIdControl.disable();
    this.propertyIdControl.setValue('');
    this.getPropertiesUseCase
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (props) => {
          const available = (props ?? []).filter((p) => !!p.id);
          this.properties.set(available);
          this.isLoadingProperties.set(false);
          this.propertyIdControl.enable();

          // A single property leaves nothing to decide, so preselect it.
          if (available.length === 1) {
            this.propertyIdControl.setValue(available[0].id);
          }
        },
        error: () => {
          this.isLoadingProperties.set(false);
          this.propertyIdControl.enable();
          this.errorMessage.set('No se pudieron cargar las propiedades de tu cuenta.');
        },
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const propertyId = this.form.controls.propertyId.value;
    if (!propertyId) {
      this.errorMessage.set('Selecciona la propiedad donde ocurrió la novedad.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { title, description } = this.form.getRawValue();

    this.createIncidentReportUseCase
      .execute({ title: title!, description: description!, propertyId })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/admin/incidents']);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          console.log(err);
          if (err.status === 400) {
            this.errorMessage.set('Datos inválidos. Verifica los campos e intenta de nuevo.');
          } else if (err.status === 403) {
            this.errorMessage.set('No tienes permiso para registrar novedades.');
          } else {
            this.errorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
          }
        },
      });
  }

  get propertyIdControl() { return this.form.controls.propertyId; }
  get titleControl() { return this.form.controls.title; }
  get descriptionControl() { return this.form.controls.description; }
}
