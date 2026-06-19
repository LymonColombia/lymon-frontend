import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GuestVerifyEmailUseCase } from '@/domain/use-cases/guest/guest-verify-email.use-case';

type VerifyStatus = 'loading' | 'success' | 'already-verified' | 'error';

@Component({
  selector: 'app-guest-verify-email',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './verify-email.html',
  styleUrls: ['../../../auth/auth-form.css'],
})
export class GuestVerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly verifyEmailUseCase = inject(GuestVerifyEmailUseCase);

  readonly status = signal<VerifyStatus>('loading');
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.errorMessage.set('No se encontró un token de verificación.');
      this.status.set('error');
      return;
    }

    this.verifyEmailUseCase.execute(token).subscribe({
      next: (res) => {
        if (res.message === 'Email already verified') {
          this.status.set('already-verified');
        } else {
          this.status.set('success');
        }
      },
      error: (err) => {
        if (err.status === 401) {
          this.errorMessage.set('El enlace de verificación es inválido o ha expirado.');
        } else {
          this.errorMessage.set('No se pudo verificar tu correo. Inténtalo de nuevo.');
        }
        this.status.set('error');
      },
    });
  }
}
