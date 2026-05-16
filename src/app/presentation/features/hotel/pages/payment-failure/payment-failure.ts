import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapXCircle, bootstrapArrowRepeat } from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { Cart } from '@/domain/entities/cart.model';
import { GetCartUseCase } from '@/domain/use-cases/cart/get-cart.use-case';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-payment-failure',
  standalone: true,
  imports: [ButtonComponent, NgIcon, RouterModule],
  providers: [provideIcons({ bootstrapXCircle, bootstrapArrowRepeat })],
  template: `
    <div class="payment-result-page">
      <div class="payment-result-card">
        <div class="result-content">
          <div class="result-icon error">
            <ng-icon name="bootstrapXCircle" size="64px" aria-hidden="true"></ng-icon>
          </div>
          <h1 class="result-title">Pago No Completado</h1>
          <p class="result-subtitle">
            El pago fue cancelado o no pudo procesarse.
            Tu carrito sigue disponible para que intentes de nuevo o modifiques tus fechas.
          </p>
          <div class="result-actions">
            <app-button variant="primary" size="medium" (clicked)="goToCheckout()">
              <ng-icon name="bootstrapArrowRepeat" size="18px" aria-hidden="true"></ng-icon>
              Intentar de Nuevo
            </app-button>
            <app-button variant="secondary" size="medium" (clicked)="goToBooking()">
              Modificar Fechas
            </app-button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--color-bg-secondary); font-family: var(--font-primary); min-height: 100vh; color: var(--color-text-primary); }
    .payment-result-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: var(--spacing-xl); }
    .payment-result-card { background: var(--color-bg-primary); border-radius: var(--radius-xl); padding: var(--spacing-5xl); max-width: 480px; width: 100%; text-align: center; border: 1px solid var(--color-border-light); box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .result-content { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-xl); }
    .result-icon.error { color: var(--color-error); }
    .result-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin: 0; }
    .result-subtitle { font-size: var(--font-size-md); color: var(--color-text-secondary); margin: 0; line-height: var(--line-height-relaxed); }
    .result-actions { display: flex; flex-direction: column; gap: var(--spacing-md); width: 100%; margin-top: var(--spacing-lg); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentFailureComponent {
  private readonly router = inject(Router);

  goToCheckout(): void {
    this.router.navigate(['/guest/checkout']);
  }

  goToBooking(): void {
    this.router.navigate(['/booking']);
  }
}
