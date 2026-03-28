import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { LyhostPlan, LYHOST_PLANS } from '@/domain/entities/lyhost-plan.model';

@Component({
  selector: 'app-lyhost-plans',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './lyhost-plans.component.html',
  styleUrl: './lyhost-plans.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyhostPlansComponent {
  readonly annual = signal(true);

  readonly plans: LyhostPlan[] = LYHOST_PLANS;

  setAnnual(value: boolean): void {
    this.annual.set(value);
  }

  getDisplayedPrice(price: string): string {
    if (price === 'Custom') {
      return 'Custom';
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice)) {
      return price;
    }

    const adjustedPrice = this.annual() ? Math.round(numericPrice * 0.8) : numericPrice;
    return `€${adjustedPrice}`;
  }
}
