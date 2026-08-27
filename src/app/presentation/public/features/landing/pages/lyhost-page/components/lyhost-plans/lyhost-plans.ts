import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { LyhostPlan, LYHOST_PLANS } from '@/domain/entities/lyhost-plan.model';

@Component({
  selector: 'app-lyhost-plans',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './lyhost-plans.html',
  styleUrl: './lyhost-plans.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyhostPlansComponent {
  readonly plans: readonly LyhostPlan[] = LYHOST_PLANS;

  isHighlighted(plan: LyhostPlan): boolean {
    return plan.type === 'PLUS';
  }

  isTrialPlan(plan: LyhostPlan): boolean {
    return plan.type === 'TRIAL';
  }

  allFeatures(plan: LyhostPlan): string[] {
    return plan.detailsSections.flatMap((s) => s.items);
  }

  isCustomPrice(plan: LyhostPlan): boolean {
    return plan.price === 'Custom' || !plan.priceSuffix;
  }
}
