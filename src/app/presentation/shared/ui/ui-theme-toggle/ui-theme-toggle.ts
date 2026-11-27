import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapMoon, bootstrapSun } from '@ng-icons/bootstrap-icons';

export type UiTheme = 'light' | 'dark';

/** Round light/dark switch: the sun sets and the moon rises. */
@Component({
  selector: 'app-ui-theme-toggle',
  imports: [NgIcon],
  providers: [provideIcons({ bootstrapSun, bootstrapMoon })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-theme-toggle.html',
  styleUrl: './ui-theme-toggle.css',
})
export class UiThemeToggleComponent {
  readonly theme = input.required<UiTheme>();
  readonly toggled = output<void>();

  protected readonly isDark = computed(() => this.theme() === 'dark');
}
