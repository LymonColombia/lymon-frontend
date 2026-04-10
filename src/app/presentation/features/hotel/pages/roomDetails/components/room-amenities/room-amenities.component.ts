import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapBriefcase,
  bootstrapCalendar,
  bootstrapCupHot,
  bootstrapDroplet,
  bootstrapSafe,
  bootstrapScissors,
  bootstrapSnow,
  bootstrapTv,
  bootstrapWifi,
} from '@ng-icons/bootstrap-icons';

type AmenityIconName =
  | 'bootstrapWifi'
  | 'bootstrapTv'
  | 'bootstrapCupHot'
  | 'bootstrapSafe'
  | 'bootstrapBriefcase'
  | 'bootstrapSnow'
  | 'bootstrapScissors'
  | 'bootstrapDroplet'
  | 'bootstrapCalendar';

@Component({
  selector: 'app-room-amenities',
  standalone: true,
  imports: [NgIconComponent],
  providers: [
    provideIcons({
      bootstrapBriefcase,
      bootstrapCalendar,
      bootstrapCupHot,
      bootstrapDroplet,
      bootstrapSafe,
      bootstrapScissors,
      bootstrapSnow,
      bootstrapTv,
      bootstrapWifi,
    }),
  ],
  templateUrl: './room-amenities.component.html',
  styleUrl: './room-amenities.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomAmenitiesComponent {
  readonly amenities = input<string[]>([]);

  private readonly amenityIconMap: Record<string, AmenityIconName> = {
    'Aire Acondicionado': 'bootstrapSnow',
    TV: 'bootstrapTv',
    Wifi: 'bootstrapWifi',
    WiFi: 'bootstrapWifi',
    Minibar: 'bootstrapCupHot',
    Cafetera: 'bootstrapCupHot',
    'Caja Fuerte': 'bootstrapSafe',
    Escritorio: 'bootstrapBriefcase',
    'Secadora de Cabello': 'bootstrapScissors',
    Ducha: 'bootstrapDroplet',
    'Servicio de Habitación': 'bootstrapCalendar',
  };

  getAmenityIcon(amenity: string): AmenityIconName {
    return this.amenityIconMap[amenity] ?? 'bootstrapCalendar';
  }
}
