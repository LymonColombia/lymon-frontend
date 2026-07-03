import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapPeopleFill } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-guest-stepper',
  standalone: true,
  imports: [NgIconComponent],
  providers: [provideIcons({ bootstrapPeopleFill })],
  templateUrl: './guest-stepper.component.html',
  styleUrl: './guest-stepper.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestStepperComponent {
  readonly value = input.required<number>();
  readonly min = input<number>(1);
  readonly max = input.required<number>();
  readonly variant = input<'compact' | 'block'>('compact');

  readonly valueChange = output<number>();

  readonly guestLabel = computed(() => {
    const v = this.value();
    return v === 1 ? '1 Huésped' : `${v} Huéspedes`;
  });

  increment(): void {
    if (this.value() < this.max()) {
      this.valueChange.emit(this.value() + 1);
    }
  }

  decrement(): void {
    if (this.value() > this.min()) {
      this.valueChange.emit(this.value() - 1);
    }
  }
}
