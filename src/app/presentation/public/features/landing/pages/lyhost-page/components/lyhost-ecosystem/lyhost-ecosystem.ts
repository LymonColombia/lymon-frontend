import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LyhostBadgeComponent } from '../lyhost-badge/lyhost-badge';

@Component({
  selector: 'app-lyhost-ecosystem',
  imports: [LyhostBadgeComponent],
  templateUrl: './lyhost-ecosystem.html',
  styleUrls: ['../../lyhost-theme.css', './lyhost-ecosystem.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyhostEcosystemComponent {
  readonly properties = [
    { name: 'Casa Laureles', meta: 'Hotel · Medellín', occupancy: 72, arrivals: 3, revenue: '$ 12,9 M' },
    { name: 'Hostal Centro', meta: 'Hostal · Medellín', occupancy: 61, arrivals: 2, revenue: '$ 8,6 M' },
    { name: 'Hotel Mar Azul', meta: 'Hotel · Santa Marta', occupancy: 70, arrivals: 1, revenue: '$ 7,2 M' },
  ];

  readonly guestTags = ['Piso alto', 'Late check-out', 'Viaja por trabajo'];

  /** A week with a real shape: quiet midweek, full weekend; today is Thursday. */
  readonly week = [64, 58, 61, 72, 88, 94, 70].map((value, i) => ({
    label: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][i],
    height: Math.round(value * 0.62),
    current: i === 3,
  }));
}
