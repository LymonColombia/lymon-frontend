import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'info';

/** Status badge from the LyHost design system: soft fill, matching text, leading dot. */
@Component({
  selector: 'app-lyhost-badge',
  template: '<ng-content />',
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      background: var(--surface-sunken);
      color: var(--ink-muted);
      font: 500 12px/16px var(--font-sans);
      white-space: nowrap;
    }
    :host::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: var(--radius-full);
      background: currentColor;
    }
    :host(.success) { background: var(--success-soft); color: var(--success); }
    :host(.warning) { background: var(--warning-soft); color: var(--warning); }
    :host(.info) { background: var(--info-soft); color: var(--info); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'tone()',
  },
})
export class LyhostBadgeComponent {
  readonly tone = input<BadgeTone>('neutral');
}
