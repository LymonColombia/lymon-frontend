import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

export function minLocalPartLength(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null | undefined;
    if (!value) return null;
    const localPart = value.split('@')[0] ?? '';
    return localPart.length >= min
      ? null
      : { minLocalPartLength: { required: min, actual: localPart.length } };
  };
}
