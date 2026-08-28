import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapWindow,
  bootstrapBuildingGear,
  bootstrapPeople,
  bootstrapGraphUpArrow,
  bootstrapWindowStack,
} from '@ng-icons/bootstrap-icons';
import { PlanFeature, PLAN_FEATURES } from '@/domain/entities/plan-feature.model';

@Component({
  selector: 'app-lyhost-features',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './lyhost-features.html',
  styleUrl: './lyhost-features.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      bootstrapWindow,
      bootstrapBuildingGear,
      bootstrapPeople,
      bootstrapGraphUpArrow,
      bootstrapWindowStack,
    }),
  ],
})
export class PlanFeaturesComponent {
  readonly hoveredIndex = signal<number | null>(null);

  readonly features: PlanFeature[] = PLAN_FEATURES;

  setHoveredIndex(index: number | null): void {
    this.hoveredIndex.set(index);
  }
}
