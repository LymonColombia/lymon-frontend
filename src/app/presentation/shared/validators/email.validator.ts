import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function minLocalPartLength(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || typeof value !== 'string') return null;

    const localPart = value.split('@')[0];
    if (!localPart || localPart.length < min) {
      return { minLocalPartLength: { requiredLength: min, actualLength: localPart?.length ?? 0 } };
    }

    return null;
  };
}
