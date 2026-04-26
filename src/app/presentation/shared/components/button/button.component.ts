import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { booleanAttribute } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'text' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'button',
    '[class]': 'hostClasses()',
    '[attr.disabled]': 'disabled() ? true : null',
    '[attr.aria-disabled]': 'disabled()',
    '[attr.type]': 'type()',
  }
})
export class ButtonComponent {
  // Signal Inputs
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('medium');
  type = input<ButtonType>('button');
  disabled = input(false, { transform: booleanAttribute });
  fullWidth = input(false, { transform: booleanAttribute });
  loading = input(false, { transform: booleanAttribute });
  
  // Signal Outputs
  clicked = output<void>();
  
  // Computed values
  readonly hostClasses = computed(() => {
    const classes = ['btn'];
    
    // Variant class
    classes.push(`btn-${this.variant()}`);
    
    // Size class
    classes.push(`btn-${this.size()}`);
    
    // State classes
    if (this.disabled()) classes.push('btn-disabled');
    if (this.loading()) classes.push('btn-loading');
    if (this.fullWidth()) classes.push('btn-full-width');
    
    return classes.join(' ');
  });
  
  onClick(event: Event): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    this.clicked.emit();
  }
}
