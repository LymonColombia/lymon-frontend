import { Injectable, signal } from '@angular/core';

import { UiTheme } from '@/presentation/shared/ui/ui-theme-toggle/ui-theme-toggle';

const STORAGE_KEY = 'lyhost-theme';
/** Matches the colour cross-fade in tenant-shell.css. */
const CROSSFADE_MS = 300;

/** Light/dark preference of the admin shell, remembered in localStorage. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<UiTheme>(this.load());
  private readonly _switching = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  readonly theme = this._theme.asReadonly();
  /** True for a moment after a switch, so the shell can cross-fade its colours. */
  readonly switching = this._switching.asReadonly();

  toggle(): void {
    const next: UiTheme = this._theme() === 'dark' ? 'light' : 'dark';
    this._theme.set(next);
    this.save(next);

    this._switching.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this._switching.set(false), CROSSFADE_MS);
  }

  private load(): UiTheme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // Storage can be blocked (private mode); fall through to the OS preference.
    }
    // Light until the user picks otherwise: pages not yet redesigned are built for it.
    return 'light';
  }

  private save(theme: UiTheme): void {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The choice still applies for this session.
    }
  }
}
