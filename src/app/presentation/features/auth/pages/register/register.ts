import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  ReactiveFormsModule,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegisterUseCase } from '@/domain/use-cases/auth/register.use-case';
import { PlanType } from '@/domain/entities/auth.model';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowRightCircleFill,
  bootstrapEnvelope,
  bootstrapLock,
  bootstrapQuestionCircleFill,
  bootstrapBuilding,
} from '@ng-icons/bootstrap-icons';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, NgIcon],
  providers: [
    provideIcons({
      bootstrapArrowRightCircleFill,
      bootstrapEnvelope,
      bootstrapLock,
      bootstrapQuestionCircleFill,
      bootstrapBuilding,
    }),
  ],
  templateUrl: './register.html',
  styleUrls: ['../../auth-form.css'],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly registerUseCase = inject(RegisterUseCase);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly planOptions: { label: string; value: PlanType }[] = [
    { label: 'Plan Básico (Trial)', value: 'TRIAL' },
    { label: 'Lymon one', value: 'LYMON_ONE' },
    { label: 'Lymon plus', value: 'PLUS' },
    { label: 'Lymon prime', value: 'PRIME' },
  ];

  readonly form = this.fb.group(
    {
      tenantName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      planType: ['TRIAL' as PlanType, Validators.required],
      terms: [false, Validators.requiredTrue],
    },
    { validators: passwordsMatchValidator },
  );

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { tenantName, email, password, planType } = this.form.getRawValue();

    this.registerUseCase
      .execute({ tenantName: tenantName!, email: email!, password: password!, planType: planType! })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          if (err.status === 409) {
            this.errorMessage.set('Ya existe una cuenta con este correo.');
          } else if (err.status === 400) {
            this.errorMessage.set('Datos inválidos. Verifica los campos.');
          } else {
            this.errorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
          }
        },
      });
  }

  get tenantNameControl() {
    return this.form.controls.tenantName;
  }
  get emailControl() {
    return this.form.controls.email;
  }
  get passwordControl() {
    return this.form.controls.password;
  }
  get confirmPasswordControl() {
    return this.form.controls.confirmPassword;
  }
  get planTypeControl() {
    return this.form.controls.planType;
  }
  get termsControl() {
    return this.form.controls.terms;
  }
}
