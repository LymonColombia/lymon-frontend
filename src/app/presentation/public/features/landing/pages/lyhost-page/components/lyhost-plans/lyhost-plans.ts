import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { Plan, PLANS } from '@/domain/shared/plan/plan.model';

@Component({
  selector: 'app-lyhost-plans',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './lyhost-plans.html',
  styleUrl: './lyhost-plans.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansComponent {
  readonly plans: readonly Plan[] = PLANS;

  isHighlighted(plan: Plan): boolean {
    return plan.type === 'PLUS';
  }

  isTrialPlan(plan: Plan): boolean {
    return plan.type === 'TRIAL';
  }

  allFeatures(plan: Plan): string[] {
    return plan.detailsSections.flatMap((s) => s.items);
  }

  isCustomPrice(plan: Plan): boolean {
    return plan.price === 'Custom' || !plan.priceSuffix;
  }
}
