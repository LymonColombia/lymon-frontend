import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { UiIconComponent } from '@/presentation/shared/ui/ui-icon/ui-icon';

export type UiTheme = 'light' | 'dark';

/** Round light/dark switch: the sun sets and the moon rises. */
@Component({
  selector: 'app-ui-theme-toggle',
  imports: [UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-theme-toggle.html',
  styleUrl: './ui-theme-toggle.css',
})
export class UiThemeToggleComponent {
  readonly theme = input.required<UiTheme>();
  readonly toggled = output<void>();

  protected readonly isDark = computed(() => this.theme() === 'dark');
}
