/** Password strength shown under new-password fields (recovery and register). */
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

/** 0 for an empty password, else 1 (weak) to 4 (very strong): length, digits, mixed case, symbols or 12+ characters. */
export function passwordStrength(pw: string): PasswordStrength {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/\d/.test(pw)) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++;
  return Math.max(1, score) as PasswordStrength;
}
