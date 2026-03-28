import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapWindow,
  bootstrapDiagram3,
  bootstrapBuildingGear,
  bootstrapPeople,
  bootstrapGraphUpArrow,
  bootstrapWindowStack,
} from '@ng-icons/bootstrap-icons';
import { LyhostFeature, LYHOST_FEATURES } from '@/domain/entities/lyhost-feature.model';

@Component({
  selector: 'app-lyhost-features',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './lyhost-features.component.html',
  styleUrl: './lyhost-features.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      bootstrapWindow,
      bootstrapDiagram3,
      bootstrapBuildingGear,
      bootstrapPeople,
      bootstrapGraphUpArrow,
      bootstrapWindowStack,
    }),
  ],
})
export class LyhostFeaturesComponent {
  readonly hoveredIndex = signal<number | null>(null);

  readonly features: LyhostFeature[] = LYHOST_FEATURES;

  setHoveredIndex(index: number | null): void {
    this.hoveredIndex.set(index);
  }
}
