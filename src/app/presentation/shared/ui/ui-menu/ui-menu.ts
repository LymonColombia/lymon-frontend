import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  model,
} from '@angular/core';

/**
 * Popover menu. Project the trigger with `menuTrigger` and the items as
 * `<app-ui-menu-item>` children:
 *
 *   <app-ui-menu #menu placement="above">
 *     <button menuTrigger [attr.aria-expanded]="menu.open()">...</button>
 *     <app-ui-menu-item>Configuración</app-ui-menu-item>
 *   </app-ui-menu>
 *
 * Closes on outside click, Escape and after an item is chosen. The panel grows
 * from the side that touches the trigger.
 */
@Component({
  selector: 'app-ui-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-menu.html',
  styleUrl: './ui-menu.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class UiMenuComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly open = model(false);
  readonly placement = input<'above' | 'below'>('below');
  readonly align = input<'start' | 'end'>('start');
  readonly label = input.required<string>();

  constructor() {
    effect(() => {
      if (!this.open()) return;
      // Wait for the panel to render, then move focus to the first item.
      requestAnimationFrame(() => this.items()[0]?.focus());
    });
  }

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  protected onPanelClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('[role="menuitem"]')) this.open.set(false);
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    const items = this.items();
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'ArrowDown':
        items[(index + 1) % items.length].focus();
        break;
      case 'ArrowUp':
        items[(index - 1 + items.length) % items.length].focus();
        break;
      case 'Home':
        items[0].focus();
        break;
      case 'End':
        items[items.length - 1].focus();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  protected onEscape(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.host.nativeElement.querySelector<HTMLElement>('.trigger button, .trigger a')?.focus();
  }

  private items(): HTMLElement[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>('.panel [role="menuitem"]'),
    );
  }
}
