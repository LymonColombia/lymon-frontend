import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapQuestionCircle } from '@ng-icons/bootstrap-icons';

export type HotelTooltipPosition = 'top' | 'right' | 'bottom' | 'left';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [NgIcon],
  providers: [provideIcons({ bootstrapQuestionCircle })],
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipComponent {
  readonly ariaLabel = input('Ver ayuda');
  readonly iconName = input('bootstrapQuestionCircle');
  readonly position = input<HotelTooltipPosition>('top');

  readonly tooltipClasses = computed(() => `tooltip-shell tooltip-${this.position()}`);
}
