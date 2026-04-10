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
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type SelectSize = 'small' | 'medium' | 'large';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [],
  templateUrl: './select.component.html',
  styleUrl: './select.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  host: {
    '[class]': 'hostClasses()',
  },
})
export class SelectComponent implements ControlValueAccessor {
  @ViewChild('selectElement', { static: false }) selectElement?: ElementRef<HTMLSelectElement>;

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
    if (this.hasIcon()) classes.push('select-with-icon');
    return classes.join(' ');
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

  onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newValue = target.value;
    
    // Try to parse as number if it's a numeric string
    const parsedValue = !isNaN(Number(newValue)) && newValue !== '' 
      ? Number(newValue) 
      : newValue;
    
    this.value.set(parsedValue);
    this.onChange(parsedValue);
    this.valueChange.emit(parsedValue);
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
    this.selectElement?.nativeElement.focus();
  }

  blur(): void {
    this.selectElement?.nativeElement.blur();
  }
}
