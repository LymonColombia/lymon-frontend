import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapStar, bootstrapStarFill } from '@ng-icons/bootstrap-icons';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { CreateUnitRatingUseCase } from '@/domain/use-cases/reservation/create-unit-rating.use-case';
import { GuestReservationResponse } from '@/domain/entities/guest-reservation.model';

const TOTAL_STARS = 5;

@Component({
  selector: 'app-rate-reservation-modal',
  standalone: true,
  imports: [ModalComponent, ButtonComponent, NgIconComponent, FormsModule],
  providers: [provideIcons({ bootstrapStar, bootstrapStarFill })],
  templateUrl: './rate-reservation-modal.component.html',
  styleUrl: './rate-reservation-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RateReservationModalComponent {
  readonly open = input<boolean>(false);
  readonly reservation = input<GuestReservationResponse | null>(null);

  readonly closed = output<void>();
  readonly submitted = output<void>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly createUnitRatingUseCase = inject(CreateUnitRatingUseCase);

  readonly selectedRate = signal(0);
  readonly hoveredRate = signal(0);
  readonly message = signal('');
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly starIndices = Array.from({ length: TOTAL_STARS }, (_, i) => i + 1);

  isStarFilled(star: number): boolean {
    const hovered = this.hoveredRate();
    return hovered > 0 ? star <= hovered : star <= this.selectedRate();
  }

  ratingLabel(): string {
    const labels: Record<number, string> = {
      1: 'Muy malo',
      2: 'Malo',
      3: 'Regular',
      4: 'Bueno',
      5: 'Excelente',
    };
    return labels[this.selectedRate()] ?? '';
  }

  onStarClick(star: number): void {
    this.selectedRate.set(star);
  }

  onStarHover(star: number): void {
    this.hoveredRate.set(star);
  }

  onStarLeave(): void {
    this.hoveredRate.set(0);
  }

  onClose(): void {
    this.reset();
    this.closed.emit();
  }

  onSubmit(): void {
    const res = this.reservation();
    if (!res || this.selectedRate() === 0) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.createUnitRatingUseCase.execute({
      reservationId: res.id,
      rate: this.selectedRate(),
      message: this.message() || undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.reset();
        this.submitted.emit();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('No se pudo enviar la valoración. Intenta de nuevo.');
      },
    });
  }

  private reset(): void {
    this.selectedRate.set(0);
    this.hoveredRate.set(0);
    this.message.set('');
    this.errorMessage.set(null);
    this.isSubmitting.set(false);
  }
}
