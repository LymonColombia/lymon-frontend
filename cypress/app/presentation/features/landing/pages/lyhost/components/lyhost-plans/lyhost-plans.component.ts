import { ChangeDetectionStrategy, Component } from '@angular/core';
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
  readonly plans: readonly LyhostPlan[] = LYHOST_PLANS;

  isHighlighted(plan: LyhostPlan): boolean {
    return plan.type === 'PLUS';
  }

  allFeatures(plan: LyhostPlan): string[] {
    return plan.detailsSections.flatMap((s) => s.items);
  }

  isCustomPrice(plan: LyhostPlan): boolean {
    return plan.price === 'Custom' || !plan.priceSuffix;
  }
}
