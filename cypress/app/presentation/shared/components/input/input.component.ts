import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
  forwardRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'tel' | 'url';
export type InputSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  host: {
    '[class]': 'hostClasses()',
  },
})
export class InputComponent implements ControlValueAccessor {
  @ViewChild('inputElement', { static: false }) inputElement?: ElementRef<HTMLInputElement>;

  // Signal Inputs
  readonly type = input<InputType>('text');
  readonly size = input<InputSize>('medium');
  readonly placeholder = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly hasIcon = input<boolean>(false);
  readonly autocomplete = input<string>('off');
  readonly name = input<string>('');
  readonly id = input<string>('');

  // Signal Outputs
  readonly valueChange = output<string | number | null>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  // Internal state
  readonly value = signal<string>('');
  readonly isFocused = signal<boolean>(false);

  // Computed host classes
  readonly hostClasses = computed(() => {
    const classes = ['input-wrapper'];
    classes.push(`input-${this.size()}`);
    if (this.disabled()) classes.push('input-disabled');
    if (this.isFocused()) classes.push('input-focused');
    if (this.hasIcon()) classes.push('input-with-icon');
    return classes.join(' ');
  });

  // ControlValueAccessor implementation
  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | number | null): void {
    this.value.set(value === null ? '' : String(value));
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;
    this.value.set(newValue);

    if (this.type() === 'number') {
      const parsedValue = newValue === '' ? null : Number(newValue);
      const normalizedValue = Number.isNaN(parsedValue) ? null : parsedValue;
      this.onChange(normalizedValue);
      this.valueChange.emit(normalizedValue);
      return;
    }

    this.onChange(newValue);
    this.valueChange.emit(newValue);
  }

  onFocus(): void {
    this.isFocused.set(true);
    this.focused.emit();
  }

  onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
    this.blurred.emit();
  }

  focus(): void {
    this.inputElement?.nativeElement.focus();
  }

  blur(): void {
    this.inputElement?.nativeElement.blur();
  }
}
