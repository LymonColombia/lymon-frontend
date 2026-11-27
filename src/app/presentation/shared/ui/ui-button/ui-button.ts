import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

export type UiButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type UiButtonSize = 'sm' | 'md';

/**
 * Pill button of the LyHost UI kit. Needs an ancestor with the `ly-theme` class
 * (the tenant shell sets it). Listen to `(click)` on the host; a disabled
 * button never emits it.
 */
@Component({
  selector: 'app-ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-button.html',
  styleUrl: './ui-button.css',
  host: {
    '[class.ui-button--block]': 'block()',
  },
})
export class UiButtonComponent {
  readonly variant = input<UiButtonVariant>('primary');
  readonly size = input<UiButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly block = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>(null);

  protected readonly classes = computed(() => `btn btn--${this.variant()} btn--${this.size()}`);
}
