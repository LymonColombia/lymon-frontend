import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
  effect,
  forwardRef,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapChevronDown } from '@ng-icons/bootstrap-icons';

export type SelectSize = 'small' | 'medium' | 'large';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './select.component.html',
  styleUrl: './select.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({ bootstrapChevronDown }),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  host: {
    '[class]': 'hostClasses()',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class SelectComponent implements ControlValueAccessor {
  @ViewChild('triggerElement', { static: false }) triggerElement?: ElementRef<HTMLButtonElement>;
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private closeAnimationTimeoutId: number | null = null;
  private static readonly CLOSE_ANIMATION_MS = 150;

  // Signal Inputs
  readonly options = input.required<SelectOption[]>();
  readonly externalValue = input<string | number | null>(null, { alias: 'value' });
  readonly size = input<SelectSize>('medium');
  readonly placeholder = input<string>('Select an option');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly hasIcon = input<boolean>(false);
  readonly name = input<string>('');
  readonly id = input<string>('');

  // Signal Outputs
  readonly valueChange = output<string | number>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  // Internal state
  readonly value = signal<string | number | null>(null);
  readonly isFocused = signal<boolean>(false);
  readonly isOpen = signal<boolean>(false);
  readonly isClosing = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.value.set(this.externalValue());
    });
  }

  // Computed host classes
  readonly hostClasses = computed(() => {
    const classes = ['select-wrapper'];
    classes.push(`select-${this.size()}`);
    if (this.disabled()) classes.push('select-disabled');
    if (this.isFocused()) classes.push('select-focused');
    if (this.isOpen()) classes.push('select-open');
    if (this.isClosing()) classes.push('select-closing');
    if (this.hasIcon()) classes.push('select-with-icon');
    return classes.join(' ');
  });

  readonly isDropdownVisible = computed(() => this.isOpen() || this.isClosing());

  readonly selectedOption = computed(() =>
    this.options().find((option) => option.value === this.value()) ?? null,
  );

  readonly triggerLabel = computed(() => {
    const selected = this.selectedOption();
    if (selected) {
      return selected.label;
    }

    return this.placeholder() || '';
  });

  // ControlValueAccessor implementation
  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | number | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Disabled state is handled through the signal input
  }

  toggleDropdown(): void {
    if (this.disabled()) {
      return;
    }

    if (this.isOpen()) {
      this.closeDropdown();
      return;
    }

    this.openDropdown();
  }

  private openDropdown(): void {
    this.clearCloseAnimationTimeout();
    this.isClosing.set(false);
    this.isOpen.set(true);
  }

  closeDropdown(): void {
    if (!this.isOpen() && !this.isClosing()) {
      return;
    }

    this.isOpen.set(false);
    this.isClosing.set(true);
    this.clearCloseAnimationTimeout();
    this.closeAnimationTimeoutId = window.setTimeout(() => {
      this.isClosing.set(false);
      this.closeAnimationTimeoutId = null;
    }, SelectComponent.CLOSE_ANIMATION_MS);
  }

  private clearCloseAnimationTimeout(): void {
    if (this.closeAnimationTimeoutId === null) {
      return;
    }

    window.clearTimeout(this.closeAnimationTimeoutId);
    this.closeAnimationTimeoutId = null;
  }

  ngOnDestroy(): void {
    this.clearCloseAnimationTimeout();
    this.isClosing.set(false);
    this.isOpen.set(false);
    this.isFocused.set(false);
  }

  selectOption(option: SelectOption): void {
    if (this.disabled() || option.disabled) {
      return;
    }

    this.updateValue(option.value, true);
    this.onTouched();
    this.triggerElement?.nativeElement.focus();
  }

  onOptionKeydown(event: KeyboardEvent, option: SelectOption): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectOption(option);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDropdown();
      this.triggerElement?.nativeElement.focus();
    }
  }

  private updateValue(value: string | number, closeAfterSelection: boolean): void {
    this.value.set(value);
    this.onChange(value);
    this.valueChange.emit(value);

    if (!closeAfterSelection) {
      return;
    }

    this.closeDropdown();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleDropdown();
      return;
    }

    if (event.key === 'Escape') {
      this.closeDropdown();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectNextEnabledOption();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectPreviousEnabledOption();
    }
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.isDropdownVisible()) {
      return;
    }

    const target = event.target as Node | null;
    if (!target || this.hostElement.nativeElement.contains(target)) {
      return;
    }

    this.closeDropdown();
    this.handleBlur();
  }

  onFocus(): void {
    this.isFocused.set(true);
    this.focused.emit();
  }

  onBlur(event: FocusEvent): void {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && this.hostElement.nativeElement.contains(nextTarget)) {
      return;
    }

    this.handleBlur();
  }

  private handleBlur(): void {
    this.isFocused.set(false);
    this.closeDropdown();
    this.onTouched();
    this.blurred.emit();
  }

  private selectNextEnabledOption(): void {
    const options = this.options();
    if (options.length === 0) {
      return;
    }

    const currentIndex = options.findIndex((option) => option.value === this.value());

    for (let index = currentIndex + 1; index < options.length; index += 1) {
      if (!options[index].disabled) {
        this.updateValue(options[index].value, false);
        return;
      }
    }

    for (let index = 0; index <= currentIndex; index += 1) {
      if (!options[index].disabled) {
        this.updateValue(options[index].value, false);
        return;
      }
    }
  }

  private selectPreviousEnabledOption(): void {
    const options = this.options();
    if (options.length === 0) {
      return;
    }

    const currentIndex = options.findIndex((option) => option.value === this.value());
    const startIndex = currentIndex === -1 ? options.length - 1 : currentIndex - 1;

    for (let index = startIndex; index >= 0; index -= 1) {
      if (!options[index].disabled) {
        this.updateValue(options[index].value, false);
        return;
      }
    }

    for (let index = options.length - 1; index > currentIndex; index -= 1) {
      if (!options[index].disabled) {
        this.updateValue(options[index].value, false);
        return;
      }
    }
  }

  focus(): void {
    this.triggerElement?.nativeElement.focus();
  }

  blur(): void {
    this.triggerElement?.nativeElement.blur();
    this.handleBlur();
  }
}
