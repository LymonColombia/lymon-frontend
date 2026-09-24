import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { CreateIncidentReportUseCase } from '@/domain/use-cases/incident/create-incident-report.use-case';
import { UserSessionService } from '@/infrastructure/services/user-session.service';

@Component({
  selector: 'app-create-incident-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    HotelPageLayoutComponent,
    ButtonComponent,
  ],
  templateUrl: './createIncidentReport.html',
  styleUrl: './createIncidentReport.css',
})
export class CreateIncidentReportComponent {
  private readonly fb = inject(FormBuilder);
  private readonly createIncidentReportUseCase = inject(CreateIncidentReportUseCase);
  private readonly userSessionService = inject(UserSessionService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const propertyId = this.userSessionService.tenantId;
    if (!propertyId) {
      this.errorMessage.set('No se pudo obtener la propiedad asociada a tu cuenta.');
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
          this.router.navigate(['/incident-report/list']);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
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

  get titleControl() { return this.form.controls.title; }
  get descriptionControl() { return this.form.controls.description; }
}
