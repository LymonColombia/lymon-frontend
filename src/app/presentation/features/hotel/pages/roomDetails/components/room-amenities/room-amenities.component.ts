import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapBriefcase,
  bootstrapCupHot,
  bootstrapDroplet,
  bootstrapForkKnife,
  bootstrapGrid,
  bootstrapSafe,
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
  'Caja Fuerte': 'bootstrapSafe',
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
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
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

  private loadSvg(name: string) {
    return toSignal(
      this.http.get(`/extra-icons/${name}.svg`, { responseType: 'text' }).pipe(
        map((svg) => this.sanitizer.bypassSecurityTrustHtml(svg))
      ),
      { initialValue: '' as unknown as SafeHtml }
    );
  }

  private readonly balconySvg = this.loadSvg('balcony');
  private readonly bathSvg = this.loadSvg('bath');
  private readonly deskSvg = this.loadSvg('desk');
  private readonly hairDryerSvg = this.loadSvg('hair-dryer');
  private readonly ironSvg = this.loadSvg('iron');
  private readonly miniBarSvg = this.loadSvg('mini-bar');
  private readonly seaSvg = this.loadSvg('sea');
  private readonly toiletSvg = this.loadSvg('toilet');

  private readonly CATEGORY_CUSTOM_SVG_MAP: Record<string, () => SafeHtml> = {
    Baño: () => this.toiletSvg(),
  };

  protected getCategoryCustomSvg(name: string): SafeHtml | null {
    return this.CATEGORY_CUSTOM_SVG_MAP[name]?.() ?? null;
  }

  private readonly CUSTOM_SVG_MAP: Record<string, () => SafeHtml> = {
    Balcón: () => this.balconySvg(),
    Terraza: () => this.balconySvg(),
    Bañera: () => this.bathSvg(),
    Ducha: () => this.bathSvg(),
    Jacuzzi: () => this.bathSvg(),
    Escritorio: () => this.deskSvg(),
    'Secador de Pelo': () => this.hairDryerSvg(),
    'Secadora de Cabello': () => this.hairDryerSvg(),
    Plancha: () => this.ironSvg(),
    'Mini Bar': () => this.miniBarSvg(),
    Minibar: () => this.miniBarSvg(),
    'Vista al Mar': () => this.seaSvg(),
    'Baño Privado': () => this.toiletSvg(),
  };

  protected hasCustomSvg(amenity: string): boolean {
    return amenity in this.CUSTOM_SVG_MAP;
  }

  protected getCustomSvgIcon(amenity: string): SafeHtml {
    return (this.CUSTOM_SVG_MAP[amenity] ?? (() => this.toiletSvg()))();
  }

  protected getAmenityIcon(amenity: string): string {
    return AMENITY_ICON_MAP[amenity] ?? 'bootstrapGrid';
  }
}
