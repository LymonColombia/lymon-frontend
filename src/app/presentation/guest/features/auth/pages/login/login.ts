import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GuestLoginUseCase } from '@/domain/guest/guest-auth/use-cases/guest-login.use-case';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowLeft,
  bootstrapArrowRight,
  bootstrapArrowRightCircleFill,
  bootstrapEnvelope,
  bootstrapGeoAlt,
  bootstrapShieldCheck,
} from '@ng-icons/bootstrap-icons';
import { PasswordInputComponent } from '@/presentation/shared/components/password-input/password-input';

interface LoginSlide {
  /** `null` renders a blank placeholder until a real picture is provided. */
  image: string | null;
  alt: string;
}

const LOGIN_SLIDES: readonly LoginSlide[] = [
  { image: '/images/suite1.jpg', alt: 'Terraza con piscina al atardecer' },
  { image: '/images/suite2.avif', alt: 'Suite con vista a la ciudad' },
  { image: null, alt: 'Habitación' },
  { image: null, alt: 'Vista de Medellín' },
  { image: null, alt: 'Zonas comunes' },
];
const VISIBLE_THUMBS = 3;

@Component({
  selector: 'app-guest-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, NgIcon, PasswordInputComponent],
  providers: [
    provideIcons({
      bootstrapEnvelope,
      bootstrapArrowRightCircleFill,
      bootstrapArrowLeft,
      bootstrapArrowRight,
      bootstrapGeoAlt,
      bootstrapShieldCheck,
    }),
  ],
  templateUrl: './login.html',
  styleUrls: ['../../../../../shared/styles/auth-form.css', './login.css'],
})
export class GuestLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly loginUseCase = inject(GuestLoginUseCase);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly emailNotVerified = signal(false);
  readonly sessionExpired = signal(
    inject(ActivatedRoute).snapshot.queryParamMap.get('sessionExpired') === 'true',
  );

  readonly slides = LOGIN_SLIDES;
  readonly activeSlide = signal(0);
  readonly currentSlide = computed(() => this.slides[this.activeSlide()]);
  /** Thumbnails shown in the strip: a window that always contains the active slide. */
  readonly visibleThumbs = computed(() => {
    const start = Math.min(
      Math.max(0, this.activeSlide() - VISIBLE_THUMBS + 1),
      this.slides.length - VISIBLE_THUMBS,
    );
    return this.slides
      .slice(start, start + VISIBLE_THUMBS)
      .map((slide, i) => ({ slide, index: start + i }));
  });

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.emailNotVerified.set(false);

    const { email, password } = this.form.getRawValue();

    this.loginUseCase.execute({ email: email!, password: password! }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (!res.emailVerified) {
          this.emailNotVerified.set(true);
        }
        this.router.navigate(['/booking']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.errorMessage.set('Correo o contraseña incorrectos.');
        } else if (err.status === 400) {
          this.errorMessage.set('Datos inválidos. Verifica los campos.');
        } else {
          this.errorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
        }
      },
    });
  }

  previousSlide(): void {
    this.activeSlide.update((i) => (i - 1 + this.slides.length) % this.slides.length);
  }

  nextSlide(): void {
    this.activeSlide.update((i) => (i + 1) % this.slides.length);
  }

  goToSlide(index: number): void {
    this.activeSlide.set(index);
  }

  get emailControl() {
    return this.form.controls.email;
  }

  get passwordControl() {
    return this.form.controls.password;
  }
}
