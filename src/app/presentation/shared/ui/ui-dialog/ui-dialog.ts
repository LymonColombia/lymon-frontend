import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  model,
  viewChild,
} from '@angular/core';

let nextId = 0;

/**
 * Modal dialog on top of the native `<dialog>`: focus trap, Escape and the
 * inert page behind it come from the browser. Project the body as content and
 * the buttons with `dialogActions`.
 */
@Component({
  selector: 'app-ui-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-dialog.html',
  styleUrl: './ui-dialog.css',
})
export class UiDialogComponent {
  readonly open = model(false);
  readonly heading = input.required<string>();

  protected readonly titleId = `ui-dialog-title-${nextId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) el.showModal();
      else if (!this.open() && el.open) el.close();
    });
  }

  /** Fires for Escape and `close()` alike, so the model never goes stale. */
  protected onClose(): void {
    this.open.set(false);
  }

  protected onBackdropPointerDown(event: PointerEvent): void {
    if (event.target === event.currentTarget) this.open.set(false);
  }
}
