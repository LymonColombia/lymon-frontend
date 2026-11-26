import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { LyhostBadgeComponent } from '../lyhost-badge/lyhost-badge';
import { landingText } from '../../i18n/lyhost-i18n';

@Component({
  selector: 'app-lyhost-ecosystem',
  imports: [LyhostBadgeComponent],
  templateUrl: './lyhost-ecosystem.html',
  styleUrls: ['../../lyhost-theme.css', './lyhost-ecosystem.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyhostEcosystemComponent {
  readonly t = landingText('ecosystem');

  /** Sample figures; names, places and revenue come from the language file. */
  readonly properties = computed(() =>
    [
      { occupancy: 72, arrivals: 3 },
      { occupancy: 61, arrivals: 2 },
      { occupancy: 70, arrivals: 1 },
    ].map((figures, i) => ({ ...this.t().propertyRows[i], ...figures })),
  );

  /** A week with a real shape: quiet midweek, full weekend; today is Thursday. */
  readonly week = computed(() =>
    [64, 58, 61, 72, 88, 94, 70].map((value, i) => ({
      label: this.t().weekDays[i],
      height: Math.round(value * 0.62),
      current: i === 3,
    })),
  );
}
