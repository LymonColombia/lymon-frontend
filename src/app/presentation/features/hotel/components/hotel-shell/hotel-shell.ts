import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '@/presentation/shared/components/sidebar/sidebar';
import { TutorialOverlayComponent } from '@/presentation/shared/components/tutorial-overlay/tutorial-overlay.component';
import { TutorialService } from '@/presentation/shared/services/tutorial.service';

@Component({
  selector: 'lyhost-hotel-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TutorialOverlayComponent],
  templateUrl: './hotel-shell.html',
  styleUrl: './hotel-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelShellComponent {
  readonly tutorialService = inject(TutorialService);
}
