import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/** "lyhost" set in Geist, as outlines so it renders the same without the font. */
const WORDMARK_PATH =
  'M4.7 -20.72V0H2.16V-20.72Z M21.42 -15.34 12.18 7.22H9.55L12.57 -0.17L6.38 -15.34H9.21L14.03 -2.91L18.79 -15.34Z M36.88 -9.04V0H34.36V-8.68Q34.36 -10.98 33.21 -12.19Q32.06 -13.41 30.07 -13.41Q28.06 -13.41 26.87 -12.15Q25.68 -10.89 25.68 -8.48V0H23.13V-20.72H25.68V-13.16Q26.43 -14.34 27.76 -14.98Q29.09 -15.62 30.74 -15.62Q32.48 -15.62 33.88 -14.88Q35.28 -14.14 36.08 -12.66Q36.88 -11.17 36.88 -9.04Z M39.26 -7.7Q39.26 -10.05 40.28 -11.86Q41.3 -13.66 43.06 -14.63Q44.83 -15.6 47.01 -15.6Q49.2 -15.6 50.96 -14.63Q52.72 -13.66 53.75 -11.87Q54.77 -10.08 54.77 -7.7Q54.77 -5.32 53.72 -3.51Q52.67 -1.71 50.88 -0.73Q49.08 0.25 46.9 0.25Q44.74 0.25 42.99 -0.73Q41.24 -1.71 40.25 -3.51Q39.26 -5.32 39.26 -7.7ZM52.16 -7.7Q52.16 -9.55 51.44 -10.84Q50.71 -12.12 49.53 -12.75Q48.36 -13.38 46.98 -13.38Q45.58 -13.38 44.42 -12.75Q43.26 -12.12 42.56 -10.84Q41.86 -9.55 41.86 -7.7Q41.86 -5.82 42.55 -4.54Q43.23 -3.25 44.38 -2.62Q45.53 -1.99 46.9 -1.99Q48.27 -1.99 49.48 -2.63Q50.68 -3.28 51.42 -4.56Q52.16 -5.85 52.16 -7.7Z M56.45 -4.51H59.08Q59.19 -3.36 60.16 -2.63Q61.12 -1.9 62.69 -1.9Q64.15 -1.9 64.99 -2.55Q65.83 -3.19 65.83 -4.17Q65.83 -5.18 64.93 -5.67Q64.04 -6.16 62.16 -6.64Q60.45 -7.08 59.37 -7.55Q58.3 -8.01 57.53 -8.92Q56.76 -9.83 56.76 -11.31Q56.76 -12.49 57.46 -13.47Q58.16 -14.45 59.44 -15.02Q60.73 -15.6 62.38 -15.6Q64.93 -15.6 66.5 -14.31Q68.07 -13.02 68.18 -10.78H65.63Q65.55 -11.98 64.67 -12.71Q63.78 -13.44 62.3 -13.44Q60.93 -13.44 60.12 -12.85Q59.3 -12.26 59.3 -11.31Q59.3 -10.56 59.79 -10.07Q60.28 -9.58 61.03 -9.28Q61.77 -8.99 63.08 -8.62Q64.74 -8.18 65.77 -7.74Q66.81 -7.31 67.55 -6.44Q68.29 -5.57 68.32 -4.17Q68.32 -2.91 67.62 -1.9Q66.92 -0.9 65.65 -0.32Q64.37 0.25 62.72 0.25Q60.96 0.25 59.56 -0.35Q58.16 -0.95 57.34 -2.03Q56.53 -3.11 56.45 -4.51Z M74.17 -13.24V-4.2Q74.17 -3.08 74.65 -2.62Q75.12 -2.16 76.3 -2.16H78.18V0H75.88Q73.75 0 72.69 -0.98Q71.62 -1.96 71.62 -4.2V-13.24H69.64V-15.34H71.62V-19.21H74.17V-15.34H78.18V-13.24Z';

/**
 * LyHost logo: the five-bar roof mark plus the wordmark.
 * - `wordmark`: shows the word next to the mark (it fades in after a short delay).
 * - `kick`: plays the mark's pinch, its bars squeeze in and spring back top to bottom.
 *   Turn it on, then off again after ~650ms, each time it should play.
 */
@Component({
  selector: 'app-ui-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-logo.html',
  styleUrl: './ui-logo.css',
  host: {
    role: 'img',
    'aria-label': 'LyHost',
    '[class.ui-logo--word]': 'wordmark()',
    '[class.ui-logo--kick]': 'kick()',
  },
})
export class UiLogoComponent {
  readonly wordmark = input(false, { transform: booleanAttribute });
  readonly kick = input(false, { transform: booleanAttribute });

  protected readonly wordmarkPath = WORDMARK_PATH;
  protected readonly bars = [
    { x: 27, y: 6, w: 10 },
    { x: 16, y: 17, w: 32 },
    { x: 12, y: 28, w: 40 },
    { x: 16, y: 39, w: 32 },
    { x: 27, y: 50, w: 10 },
  ];
}
