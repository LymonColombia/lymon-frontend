import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '@/presentation/tenant/layout/sidebar/sidebar';
import { TutorialOverlayComponent } from '@/presentation/tenant/layout/tutorial-overlay/tutorial-overlay';
import { TutorialService } from '@/presentation/tenant/services/tutorial.service';

@Component({
  selector: 'lyhost-tenant-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TutorialOverlayComponent],
  templateUrl: './tenant-shell.html',
  styleUrl: './tenant-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantShellComponent {
  readonly tutorialService = inject(TutorialService);
}
