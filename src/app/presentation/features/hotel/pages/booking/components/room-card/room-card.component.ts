import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapDoorOpenFill,
  bootstrapHouseDoorFill,
  bootstrapPeopleFill,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';

export type RoomFeatureIconName =
  | 'bootstrapHouseDoorFill'
  | 'bootstrapDoorOpenFill'
  | 'bootstrapPeopleFill';

export interface BookingRoomFeature {
  readonly label: string;
  readonly icon: RoomFeatureIconName;
}

export interface BookingRoomCard {
  readonly id: string;
  readonly title: string;
  readonly price: number;
  readonly description: string;
  readonly features: readonly BookingRoomFeature[];
  readonly amenities: readonly string[];
  readonly badgeLabel: string;
  readonly badgeVariant?: 'default' | 'popular';
  readonly featured?: boolean;
}

@Component({
  selector: 'app-room-card',
  standalone: true,
  imports: [ButtonComponent, NgIcon],
  providers: [
    provideIcons({
      bootstrapDoorOpenFill,
      bootstrapHouseDoorFill,
      bootstrapPeopleFill,
    }),
  ],
  templateUrl: './room-card.component.html',
  styleUrl: './room-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomCardComponent {
  readonly room = input.required<BookingRoomCard>();
  readonly viewDetails = output<void>();

  onViewDetails(): void {
    this.viewDetails.emit();
  }
}
