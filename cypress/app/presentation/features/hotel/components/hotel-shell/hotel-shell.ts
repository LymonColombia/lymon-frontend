import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '@/presentation/shared/components/sidebar/sidebar';

@Component({
  selector: 'lyhost-hotel-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './hotel-shell.html',
  styleUrl: './hotel-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelShellComponent {}
