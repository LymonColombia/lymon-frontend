import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, timer } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapCheckCircle, bootstrapExclamationTriangle, bootstrapShield } from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { GetCheckoutPayloadUseCase } from '@/domain/use-cases/payment/get-checkout-payload.use-case';
import { GetPaymentStatusUseCase } from '@/domain/use-cases/payment/get-payment-status.use-case';
import { GetPaymentSessionStatusResult, PaymentCheckoutResponse, PaymentStatus } from '@/domain/entities/payment.model';
import { Cart } from '@/domain/entities/cart.model';

declare var WidgetCheckout: any;

interface WompiWidgetResult {
  transaction?: { id: string; status?: string };
}

const MAX_POLLING_ATTEMPTS = 15;
const INITIAL_POLLING_DELAY_MS = 1000;
const MAX_POLLING_DELAY_MS = 5000;
const POLLING_BACKOFF_FACTOR = 1.5;

type PollingStatus = 'IDLE' | 'POLLING' | 'FINISHED' | 'TIMEOUT';

@Component({
  selector: 'app-payment-panel',
  standalone: true,
  imports: [ButtonComponent, NgIcon],
  providers: [provideIcons({ bootstrapCheckCircle, bootstrapExclamationTriangle, bootstrapShield })],
  templateUrl: './payment-panel.html',
  styleUrl: './payment-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentPanelComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getCheckoutPayloadUseCase = inject(GetCheckoutPayloadUseCase);
  private readonly getPaymentStatusUseCase = inject(GetPaymentStatusUseCase);
  private isDestroyed = false;

  readonly cart = input<Cart | null>(null);

  readonly paymentSucceeded = output<void>();
  readonly cartRefreshNeeded = output<void>();

  readonly isProcessingPayment = signal(false);
  readonly paymentStatus = signal<PaymentStatus | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly notes = signal('');
  readonly pollingStatus = signal<PollingStatus>('IDLE');

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.isDestroyed = true;
    });
  }

  onNotesChange(value: string): void {
    this.notes.set(value);
  }

  confirmPayment(): void {
    const cart = this.cart();
    if (!cart?.reservationItem) return;

    this.isProcessingPayment.set(true);
    this.errorMessage.set(null);

    this.getCheckoutPayloadUseCase.execute(this.notes()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (payload) => {
        this.isProcessingPayment.set(false);
        this.openWompiWidget(payload);
      },
      error: (err: { error?: { message?: string } }) => {
        this.isProcessingPayment.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Ocurrió un error al preparar el pago. Intenta de nuevo.');
      },
    });
  }

  private openWompiWidget(payload: PaymentCheckoutResponse): void {
    const widget = new WidgetCheckout({
      publicKey: payload.publicKey,
      currency: payload.currency,
      amountInCents: payload.amountInCents,
      reference: payload.reference,
      signature: { integrity: payload.signatureIntegrity },
      redirectUrl: payload.redirectUrl,
      customerData: payload.customerData,
      metadata: {
        ...payload.metadata,
        notes: this.notes(),
      },
    });

    widget.open((result: WompiWidgetResult) => {
      if (result.transaction) {
        this.startPolling(payload.reference);
      }
    });
  }

  private async startPolling(reference: string): Promise<void> {
    let attempt = 0;
    let delay = INITIAL_POLLING_DELAY_MS;

    this.pollingStatus.set('POLLING');

    while (attempt < MAX_POLLING_ATTEMPTS) {
      if (this.isDestroyed) return;
      attempt++;
      try {
        const status = await firstValueFrom(this.getPaymentStatusUseCase.execute(reference));
        if (this.isDestroyed) return;
        this.paymentStatus.set(status.status);

        if (status.isTerminal) {
          this.handleTerminalStatus(status);
          return;
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }

      await firstValueFrom(timer(delay));
      if (this.isDestroyed) return;
      delay = Math.min(MAX_POLLING_DELAY_MS, Math.floor(delay * POLLING_BACKOFF_FACTOR));
    }

    this.pollingStatus.set('TIMEOUT');
    this.errorMessage.set('No pudimos confirmar el pago a tiempo. Por favor verifica tu correo o intenta de nuevo.');
  }

  private handleTerminalStatus(status: GetPaymentSessionStatusResult): void {
    this.pollingStatus.set('FINISHED');
    if (status.status === 'APPROVED') {
      this.paymentSucceeded.emit();
    } else if (status.status === 'DECLINED') {
      this.errorMessage.set('El pago fue rechazado. Por favor intenta con otro medio de pago.');
      this.cartRefreshNeeded.emit();
    } else if (status.status === 'ERROR') {
      this.errorMessage.set('Ocurrió un error al procesar el pago.');
      this.cartRefreshNeeded.emit();
    } else {
      this.errorMessage.set(`El pago finalizó con estado: ${status.status}`);
      this.cartRefreshNeeded.emit();
    }
  }
}
