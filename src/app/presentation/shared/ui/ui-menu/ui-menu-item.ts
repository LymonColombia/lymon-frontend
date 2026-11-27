import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Row of an `<app-ui-menu>`. Listen to `(click)` on the host. */
@Component({
  selector: 'app-ui-menu-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" role="menuitem" class="item" [class.item--danger]="tone() === 'danger'">
      <ng-content />
    </button>
  `,
  styles: `
    :host {
      display: block;
    }

    .item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
      padding: 8px 10px;
      border: 0;
      border-radius: var(--ly-r-md);
      background: transparent;
      color: var(--ink);
      font: 500 14px/20px var(--font-sans);
      text-align: left;
      cursor: pointer;
      transition: background-color 150ms ease-out;
    }

    .item:focus-visible {
      outline: 2px solid var(--focus-ring);
      outline-offset: -2px;
    }

    .item--danger {
      color: var(--danger);
    }

    @media (hover: hover) and (pointer: fine) {
      .item:hover {
        background: var(--surface-sunken);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .item {
        transition: none;
      }
    }
  `,
})
export class UiMenuItemComponent {
  readonly tone = input<'default' | 'danger'>('default');
}
