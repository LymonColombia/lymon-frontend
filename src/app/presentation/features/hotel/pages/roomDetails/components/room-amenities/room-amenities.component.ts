import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapBriefcase,
  bootstrapCupHot,
  bootstrapDroplet,
  bootstrapForkKnife,
  bootstrapGrid,
  bootstrapSafe,
  bootstrapScissors,
  bootstrapSnow,
  bootstrapSunrise,
  bootstrapThermometerSun,
  bootstrapTv,
  bootstrapWifi,
} from '@ng-icons/bootstrap-icons';

interface AmenityCategory {
  name: string;
  icon: string;
  amenities: string[];
}

const AMENITY_CATEGORY_MAP: Record<string, string> = {
  WiFi: 'Conectividad',
  Wifi: 'Conectividad',
  TV: 'Conectividad',
  'Aire Acondicionado': 'Climatización',
  Calefacción: 'Climatización',
  Ventilador: 'Climatización',
  Cafetera: 'Comodidad',
  'Mini Bar': 'Comodidad',
  Minibar: 'Comodidad',
  Escritorio: 'Comodidad',
  'Caja Fuerte': 'Comodidad',
  Plancha: 'Comodidad',
  'Baño Privado': 'Baño',
  Bañera: 'Baño',
  Ducha: 'Baño',
  'Secador de Pelo': 'Baño',
  'Secadora de Cabello': 'Baño',
  Jacuzzi: 'Baño',
  Balcón: 'Exterior',
  Terraza: 'Exterior',
  'Vista al Mar': 'Exterior',
  Jardín: 'Exterior',
  Piscina: 'Exterior',
  Cocina: 'Cocina',
  Nevera: 'Cocina',
  Microondas: 'Cocina',
  Horno: 'Cocina',
  Lavavajillas: 'Cocina',
};

const CATEGORY_ICON_MAP: Record<string, string> = {
  Conectividad: 'bootstrapWifi',
  Climatización: 'bootstrapThermometerSun',
  Comodidad: 'bootstrapBriefcase',
  Baño: 'bootstrapDroplet',
  Exterior: 'bootstrapSunrise',
  Cocina: 'bootstrapForkKnife',
  Otros: 'bootstrapGrid',
};

const AMENITY_ICON_MAP: Record<string, string> = {
  WiFi: 'bootstrapWifi',
  Wifi: 'bootstrapWifi',
  TV: 'bootstrapTv',
  'Aire Acondicionado': 'bootstrapSnow',
  Calefacción: 'bootstrapThermometerSun',
  Cafetera: 'bootstrapCupHot',
  'Mini Bar': 'bootstrapCupHot',
  Minibar: 'bootstrapCupHot',
  'Caja Fuerte': 'bootstrapSafe',
  Escritorio: 'bootstrapBriefcase',
  Plancha: 'bootstrapScissors',
  'Baño Privado': 'bootstrapDroplet',
  Bañera: 'bootstrapDroplet',
  Ducha: 'bootstrapDroplet',
  'Secador de Pelo': 'bootstrapScissors',
  'Secadora de Cabello': 'bootstrapScissors',
  Balcón: 'bootstrapSunrise',
  Terraza: 'bootstrapSunrise',
  'Vista al Mar': 'bootstrapSunrise',
  Cocina: 'bootstrapForkKnife',
  Nevera: 'bootstrapForkKnife',
};

@Component({
  selector: 'app-room-amenities',
  standalone: true,
  imports: [NgIconComponent],
  providers: [
    provideIcons({
      bootstrapBriefcase,
      bootstrapCupHot,
      bootstrapDroplet,
      bootstrapForkKnife,
      bootstrapGrid,
      bootstrapSafe,
      bootstrapScissors,
      bootstrapSnow,
      bootstrapSunrise,
      bootstrapThermometerSun,
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

  readonly groupedAmenities = computed((): AmenityCategory[] => {
    const groups: Record<string, string[]> = {};

    for (const amenity of this.amenities()) {
      const category = AMENITY_CATEGORY_MAP[amenity] ?? 'Otros';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(amenity);
    }

    return Object.entries(groups).map(([name, amenities]) => ({
      name,
      icon: CATEGORY_ICON_MAP[name] ?? 'bootstrapGrid',
      amenities,
    }));
  });

  protected getAmenityIcon(amenity: string): string {
    return AMENITY_ICON_MAP[amenity] ?? 'bootstrapGrid';
  }
}
