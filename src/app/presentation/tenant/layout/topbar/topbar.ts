import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapList } from '@ng-icons/bootstrap-icons';

import { UiIconButtonComponent } from '@/presentation/shared/ui/ui-icon-button/ui-icon-button';
import {
  UiTheme,
  UiThemeToggleComponent,
} from '@/presentation/shared/ui/ui-theme-toggle/ui-theme-toggle';

/** Header of the admin shell: where you are, and the theme switch. */
@Component({
  selector: 'app-tenant-topbar',
  imports: [NgIcon, UiIconButtonComponent, UiThemeToggleComponent],
  providers: [provideIcons({ bootstrapList })],
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
