import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapDoorOpenFill,
  bootstrapGeoAlt,
  bootstrapHeart,
  bootstrapHeartFill,
  bootstrapHouseDoorFill,
  bootstrapPeopleFill,
  bootstrapStarFill,
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
  readonly badgeVariant?: 'available' | 'shared' | 'last';
  readonly featured?: boolean;
  readonly imageUrl?: string;
  readonly rating?: number;
  readonly reviews?: number;
  readonly location?: string;
  readonly maxGuests?: number;
}

@Component({
  selector: 'booking-room-card',
  standalone: true,
  imports: [ButtonComponent, NgIcon],
  providers: [
    provideIcons({
      bootstrapDoorOpenFill,
      bootstrapHouseDoorFill,
      bootstrapPeopleFill,
      bootstrapStarFill,
      bootstrapGeoAlt,
      bootstrapHeart,
      bootstrapHeartFill,
    }),
  ],
  templateUrl: './room-card.component.html',
  styleUrl: './room-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomCardComponent {
  readonly room = input.required<BookingRoomCard>();
  readonly isLiked = input<boolean>(false);
  readonly viewDetails = output<string>();
  readonly toggleLike = output<string>();

  onViewDetails(): void {
    this.viewDetails.emit(this.room().id);
  }

  onToggleLike(): void {
    this.toggleLike.emit(this.room().id);
  }
}
