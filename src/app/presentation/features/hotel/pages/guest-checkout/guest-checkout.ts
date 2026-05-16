import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapCalendar,
  bootstrapCheckCircle,
  bootstrapCheckCircleFill,
  bootstrapChevronLeft,
  bootstrapExclamationTriangle,
  bootstrapPeopleFill,
  bootstrapShield,
  bootstrapCart,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { GetCheckoutPayloadUseCase } from '@/domain/use-cases/payment/get-checkout-payload.use-case';
import { GetPaymentStatusUseCase } from '@/domain/use-cases/payment/get-payment-status.use-case';
import { GetCartUseCase } from '@/domain/use-cases/cart/get-cart.use-case';
import { PaymentCheckoutResponse, PaymentStatus } from '@/domain/entities/payment.model';
import { Cart } from '@/domain/entities/cart.model';
import { firstValueFrom, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

declare var WidgetCheckout: any;

@Component({
  selector: 'app-guest-checkout',
  standalone: true,
  imports: [ButtonComponent, FooterComponent, FormsModule, NgIcon, RouterModule],
  providers: [provideIcons({
    bootstrapCalendar,
    bootstrapCheckCircle,
    bootstrapCheckCircleFill,
    bootstrapChevronLeft,
    bootstrapExclamationTriangle,
    bootstrapPeopleFill,
    bootstrapShield,
    bootstrapCart,
  })],
  templateUrl: './guest-checkout.html',
  styleUrl: './guest-checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestCheckoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly getCartUseCase = inject(GetCartUseCase);
  private readonly getCheckoutPayloadUseCase = inject(GetCheckoutPayloadUseCase);
  private readonly getPaymentStatusUseCase = inject(GetPaymentStatusUseCase);

  readonly cart = signal<Cart | null>(null);
  readonly isLoadingCart = signal(true);
  readonly isProcessingPayment = signal(false);
  readonly isSuccess = signal(false);
  readonly paymentStatus = signal<PaymentStatus | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly notes = signal('');
  readonly pollingStatus = signal<'IDLE' | 'POLLING' | 'FINISHED' | 'TIMEOUT'>('IDLE');

  ngOnInit(): void {
    this.loadCart();
  }

  private loadCart(): void {
    this.isLoadingCart.set(true);
    this.getCartUseCase.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (cart) => {
        this.cart.set(cart);
        this.isLoadingCart.set(false);
      },
      error: () => {
        this.cart.set(null);
        this.isLoadingCart.set(false);
        this.errorMessage.set('No se pudo cargar el carrito. Intenta de nuevo.');
      },
    });
  }

  onNotesChange(value: string): void {
    this.notes.set(value);
  }

  confirmReservation(): void {
    const cart = this.cart();
    if (!cart?.reservationItem) return;

    this.isProcessingPayment.set(true);
    this.errorMessage.set(null);

    this.getCheckoutPayloadUseCase.execute(this.notes()).subscribe({
      next: (payload) => {
        this.isProcessingPayment.set(false);
        this.openWompiWidget(payload);
      },
      error: (err: { error?: { message?: string } }) => {
        this.isProcessingPayment.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Ocurrió un error al preparar el checkout. Intenta de nuevo.');
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

    widget.open((result: any) => {
      const transaction = result.transaction;
      if (transaction) {
        this.startPolling(payload.reference);
      }
    });
  }

  private async startPolling(reference: string): Promise<void> {
    const maxAttempts = 15;
    let attempt = 0;
    let delay = 1000;

    this.pollingStatus.set('POLLING');

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const status = await firstValueFrom(this.getPaymentStatusUseCase.execute(reference));
        this.paymentStatus.set(status.status);

        if (status.isTerminal) {
          this.handleTerminalStatus(status);
          return;
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }

      await firstValueFrom(timer(delay));
      delay = Math.min(5000, Math.floor(delay * 1.5));
    }

    this.pollingStatus.set('TIMEOUT');
    this.errorMessage.set('No pudimos confirmar el pago a tiempo. Por favor verifica tu correo o intenta de nuevo.');
  }

  private handleTerminalStatus(status: any): void {
    this.pollingStatus.set('FINISHED');
    if (status.status === 'APPROVED') {
      this.isSuccess.set(true);
    } else if (status.status === 'DECLINED') {
      this.errorMessage.set('El pago fue rechazado. Por favor intenta con otro medio de pago.');
      this.loadCart();
    } else if (status.status === 'ERROR') {
      this.errorMessage.set('Ocurrió un error al procesar el pago.');
      this.loadCart();
    } else {
      this.errorMessage.set(`El pago finalizó con estado: ${status.status}`);
      this.loadCart();
    }
  }

  goBack(): void {
    const unitId = this.cart()?.reservationItem?.unitId;
    if (unitId) {
      this.router.navigate(['/room-details', unitId]);
    } else {
      this.router.navigate(['/booking']);
    }
  }

  goToBooking(): void {
    this.router.navigate(['/booking']);
  }

  goToReservations(): void {
    this.router.navigate(['/guest/reservations']);
  }

  get reservationItem() {
    return this.cart()?.reservationItem ?? null;
  }

  get nights(): number {
    const item = this.reservationItem;
    if (!item?.checkIn || !item?.checkOut) return 0;

    const checkInDate = this.parseDatePart(item.checkIn);
    const checkOutDate = this.parseDatePart(item.checkOut);
    if (!checkInDate || !checkOutDate) return 0;

    return Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) / 86_400_000,
    );
  }

  get computedTotal(): number {
    return (this.reservationItem?.pricePerNight ?? 0) * this.nights;
  }

  private parseDatePart(dateStr: string): Date | null {
    if (!dateStr) return null;
    const clean = dateStr.split('T')[0];
    const [year, month, day] = clean.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month - 1, day);
  }

  formatDate(dateStr: string): string {
    const date = this.parseDatePart(dateStr);
    if (!date) return dateStr;
    return date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
}
