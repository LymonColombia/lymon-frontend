import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapCheckCircleFill, bootstrapXCircle } from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { GetPaymentStatusUseCase } from '@/domain/guest/payment/use-cases/get-payment-status.use-case';
import { PaymentStatus } from '@/domain/guest/payment/payment.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [ButtonComponent, NgIcon, RouterModule],
  providers: [provideIcons({ bootstrapCheckCircleFill, bootstrapXCircle })],
  template: `
    <div class="payment-result-page">
      <div class="payment-result-card">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Verificando tu pago...</p>
          </div>
        }

        @if (!isLoading() && status() === 'APPROVED') {
          <div class="result-content">
            <div class="result-icon success">
              <ng-icon name="bootstrapCheckCircleFill" size="64px" aria-hidden="true"></ng-icon>
            </div>
            <h1 class="result-title">¡Pago Exitoso!</h1>
            <p class="result-subtitle">Tu reserva ha sido confirmada. Recibirás un correo con los detalles.</p>
            <div class="result-actions">
              <app-button variant="primary" size="medium" (clicked)="goToReservations()">
                Ver Mis Reservas
              </app-button>
              <app-button variant="secondary" size="medium" (clicked)="goToBooking()">
                Ver Más Habitaciones
              </app-button>
            </div>
          </div>
        }

        @if (!isLoading() && status() && status() !== 'APPROVED') {
          <div class="result-content">
            <div class="result-icon error">
              <ng-icon name="bootstrapXCircle" size="64px" aria-hidden="true"></ng-icon>
            </div>
            <h1 class="result-title">Pago {{ status() }}</h1>
            <p class="result-subtitle">El pago no pudo completarse. Puedes intentar de nuevo desde el carrito.</p>
            <div class="result-actions">
              <app-button variant="primary" size="medium" (clicked)="goToCart()">
                Ir al Carrito
              </app-button>
            </div>
          </div>
        }

        @if (!isLoading() && errorMessage()) {
          <div class="result-content">
            <div class="result-icon error">
              <ng-icon name="bootstrapXCircle" size="64px" aria-hidden="true"></ng-icon>
            </div>
            <h1 class="result-title">Error de Verificación</h1>
            <p class="result-subtitle">{{ errorMessage() }}</p>
            <div class="result-actions">
              <app-button variant="primary" size="medium" (clicked)="goToReservations()">
                Ver Mis Reservas
              </app-button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--color-bg-secondary); font-family: var(--font-primary); min-height: 100vh; color: var(--color-text-primary); }
    .payment-result-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: var(--spacing-xl); }
    .payment-result-card { background: var(--color-bg-primary); border-radius: var(--radius-xl); padding: var(--spacing-5xl); max-width: 480px; width: 100%; text-align: center; border: 1px solid var(--color-border-light); box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-xl); padding: var(--spacing-4xl); }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--color-bg-secondary); border-top: 3px solid var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .result-content { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-xl); }
    .result-icon.success { color: var(--color-success); }
    .result-icon.error { color: var(--color-error); }
    .result-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin: 0; }
    .result-subtitle { font-size: var(--font-size-md); color: var(--color-text-secondary); margin: 0; line-height: var(--line-height-relaxed); }
    .result-actions { display: flex; flex-direction: column; gap: var(--spacing-md); width: 100%; margin-top: var(--spacing-lg); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly getPaymentStatusUseCase = inject(GetPaymentStatusUseCase);

  readonly isLoading = signal(true);
  readonly status = signal<PaymentStatus | null>(null);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const reference = this.route.snapshot.queryParamMap.get('reference');
    if (!reference) {
      this.isLoading.set(false);
      this.errorMessage.set('No se recibió la referencia de pago.');
      return;
    }

    this.getPaymentStatusUseCase.execute(reference).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.status.set(result.status);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudo verificar el estado del pago. Revisa tus reservas para confirmar.');
      },
    });
  }

  goToReservations(): void {
    this.router.navigate(['/guest/reservations']);
  }

  goToBooking(): void {
    this.router.navigate(['/booking']);
  }

  goToCart(): void {
    this.router.navigate(['/guest/cart']);
  }
}
