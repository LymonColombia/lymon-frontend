import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Unit } from '@/domain/entities/staff.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapStarFill } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-room-hero',
  standalone: true,
  imports: [NgIconComponent],
  providers: [provideIcons({ bootstrapStarFill })],
  templateUrl: './room-hero.component.html',
  styleUrl: './room-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomHeroComponent {
  readonly unit = input.required<Unit>();
}
