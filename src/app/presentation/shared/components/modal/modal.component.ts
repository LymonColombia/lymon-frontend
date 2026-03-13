import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export type ModalSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '(document:keydown.escape)': 'onEscapeKey()',
  },
})
export class ModalComponent {
  private static nextId = 0;
  private readonly componentId = ++ModalComponent.nextId;

  readonly open = input<boolean>(false);
  readonly title = input<string>('');
  readonly size = input<ModalSize>('medium');
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closeOnEscape = input<boolean>(true);

  readonly closed = output<void>();

  readonly hostClasses = computed(() => {
    const classes = ['modal-wrapper'];
    classes.push(`modal-${this.size()}`);
    if (this.open()) classes.push('modal-open');
    return classes.join(' ');
  });

  readonly titleId = computed(() => {
    if (!this.title()) {
      return null;
    }

    return `app-modal-title-${this.componentId}`;
  });

  requestClose(): void {
    if (!this.open()) {
      return;
    }

    this.closed.emit();
  }

  onBackdropClick(): void {
    if (!this.closeOnBackdrop()) {
      return;
    }

    this.requestClose();
  }

  onEscapeKey(): void {
    if (!this.open() || !this.closeOnEscape()) {
      return;
    }

    this.requestClose();
  }

  onDialogClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
