import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { UiIconComponent } from '@/presentation/shared/ui/ui-icon/ui-icon';
import { UiIconButtonComponent } from '@/presentation/shared/ui/ui-icon-button/ui-icon-button';
import {
  UiTheme,
  UiThemeToggleComponent,
} from '@/presentation/shared/ui/ui-theme-toggle/ui-theme-toggle';

/** Header of the admin shell: where you are, and the theme switch. */
@Component({
  selector: 'app-tenant-topbar',
  imports: [UiIconComponent, UiIconButtonComponent, UiThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class TenantTopbarComponent {
  readonly group = input<string | null>(null);
  readonly label = input('');
  readonly theme = input.required<UiTheme>();
  readonly menuOpen = input(false);

  readonly menuToggled = output<void>();
  readonly themeToggled = output<void>();
}
