import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

/**
 * Round icon-only button. Project an `<ng-icon>` as content; `label` is the
 * accessible name and is required because there is no visible text.
 */
@Component({
  selector: 'app-ui-icon-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-icon-button.html',
  styleUrl: './ui-icon-button.css',
})
export class UiIconButtonComponent {
  readonly label = input.required<string>();
  readonly size = input<'sm' | 'md'>('md');
  readonly pressed = input<boolean | null>(null);
  readonly expanded = input<boolean | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
}
