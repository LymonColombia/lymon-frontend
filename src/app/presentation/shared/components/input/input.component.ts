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

export type InputType = 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'tel' | 'url'|'currency';
export type InputSize = 'small' | 'medium' | 'large';

type TypeValue = string | number | null;

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
  readonly maxlength = input<number | string | null>(null);

  readonly valueChange = output<string | number | null>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  readonly value = signal('');
  readonly isFocused = signal<boolean>(false);


  readonly nativeType = computed(() => {
    return this.type() === 'currency'
      ? 'text'
      : this.type();
  });

  readonly hostClasses = computed(() => {
    const classes = ['input-wrapper'];
    classes.push(`input-${this.size()}`);
    if (this.disabled()) classes.push('input-disabled');
    if (this.isFocused()) classes.push('input-focused');
    if (this.hasIcon()) classes.push('input-with-icon');
    return classes.join(' ');
  });

  private onChange: (value: TypeValue) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value:TypeValue): void {
    if (value === null || value === undefined || value === '') {
      this.value.set('');
      return;
    }

    if (this.type() === 'currency') {
      this.value.set(
        this.formatCurrency(String(value))
      );
      return;
    }

    this.value.set(String(value));
  }

  registerOnChange(fn: (value: TypeValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const inputValue = target.value;

   
    if (this.type() === 'currency') {
      const digits = inputValue.replace(/\D/g, '');

      const formatted = this.formatCurrency(digits);

      this.value.set(formatted);

      const numericValue =
        digits === '' ? null : Number(digits);

      this.onChange(numericValue);
      this.valueChange.emit(numericValue);

      return;
    }

    
    if (this.type() === 'number') {
      this.value.set(inputValue);

      const parsedValue =
        inputValue === ''
          ? null
          : Number(inputValue);

      const normalizedValue = Number.isNaN(parsedValue)
        ? null
        : parsedValue;

      this.onChange(normalizedValue);
      this.valueChange.emit(normalizedValue);
      return;
    }

    
    this.value.set(inputValue);
    this.onChange(inputValue);
    this.valueChange.emit(inputValue);
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

private formatCurrency(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (!digits) return '';

  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(Number(digits));
}
}