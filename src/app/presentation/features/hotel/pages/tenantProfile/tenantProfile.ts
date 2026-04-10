import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { GetTenantProfileUseCase } from '@/domain/use-cases/tenant/get-tenant-profile.use-case';
import { UpdateTenantProfileUseCase } from '@/domain/use-cases/tenant/update-tenant-profile.use-case';

const URL_PATTERN = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w\-./?%&=]*)?$/;

@Component({
  selector: 'app-tenant-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, HotelPageLayoutComponent],
  templateUrl: './tenantProfile.html',
  styleUrl: './tenantProfile.css',
})
export class TenantProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly getTenantProfileUseCase = inject(GetTenantProfileUseCase);
  private readonly updateTenantProfileUseCase = inject(UpdateTenantProfileUseCase);

  readonly isLoadingProfile = signal(true);
  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    contactPhone: ['', [Validators.minLength(7), Validators.maxLength(30)]],
    address: ['', [Validators.maxLength(200)]],
    website: ['', [Validators.pattern(URL_PATTERN)]],
    logoUrl: ['', [Validators.pattern(URL_PATTERN)]],
  });

  ngOnInit(): void {
    this.getTenantProfileUseCase.execute().subscribe({
      next: (res) => {
        const p = res.data;
        this.form.patchValue({
          name: p.name ?? '',
          contactPhone: p.contactPhone ?? '',
          address: p.address ?? '',
          website: p.website ?? '',
          logoUrl: p.logoUrl ?? '',
        });
        this.isLoadingProfile.set(false);
      },
      error: () => {
        this.isLoadingProfile.set(false);
        this.errorMessage.set('No se pudo cargar el perfil. Inténtalo de nuevo.');
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();

    this.updateTenantProfileUseCase
      .execute({
        name: raw.name || undefined,
        contactPhone: raw.contactPhone || null,
        address: raw.address || null,
        website: raw.website || null,
        logoUrl: raw.logoUrl || null,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set('Perfil actualizado exitosamente.');
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          if (err.status === 400) {
            this.errorMessage.set('Datos inválidos. Verifica los campos e intenta de nuevo.');
          } else if (err.status === 403) {
            this.errorMessage.set('No tienes permiso para editar el perfil.');
          } else {
            this.errorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
          }
        },
      });
  }

  get nameControl() { return this.form.controls.name; }
  get contactPhoneControl() { return this.form.controls.contactPhone; }
  get addressControl() { return this.form.controls.address; }
  get websiteControl() { return this.form.controls.website; }
  get logoUrlControl() { return this.form.controls.logoUrl; }
}
