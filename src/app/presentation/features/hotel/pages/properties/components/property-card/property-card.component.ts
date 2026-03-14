import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { Property } from '@/domain/entities/staff.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBuildingFill,
  bootstrapBuildingsFill,
  bootstrapDoorOpenFill,
  bootstrapGeoAltFill,
  bootstrapHouseDoorFill,
  bootstrapHouseFill,
  bootstrapTreeFill,
} from '@ng-icons/bootstrap-icons';

type PropertyIconName =
  | 'bootstrapBuildingsFill'
  | 'bootstrapHouseFill'
  | 'bootstrapBuildingFill'
  | 'bootstrapHouseDoorFill'
  | 'bootstrapTreeFill';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [ButtonComponent, NgIcon],
  providers: [
    provideIcons({
      bootstrapBuildingFill,
      bootstrapBuildingsFill,
      bootstrapDoorOpenFill,
      bootstrapGeoAltFill,
      bootstrapHouseDoorFill,
      bootstrapHouseFill,
      bootstrapTreeFill,
    }),
  ],
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyCardComponent {
  readonly property = input.required<Property>();
  readonly viewUnits = output<string>();

  readonly propertyTypeLabel = computed(() => {
    const rawType = this.property().propertyType;
    if (!rawType) {
      return '';
    }

    const normalizedType = rawType.toLowerCase();
    return normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
  });

  readonly propertyTypeIcon = computed<PropertyIconName>(() => {
    switch (this.property().propertyType) {
      case 'HOTEL':
        return 'bootstrapBuildingsFill';
      case 'CASA':
        return 'bootstrapHouseFill';
      case 'APARTAMENTO':
        return 'bootstrapBuildingFill';
      case 'VILLA':
        return 'bootstrapHouseDoorFill';
      case 'HOSTAL':
        return 'bootstrapBuildingFill';
      case 'GLAMPING':
        return 'bootstrapTreeFill';
      default:
        return 'bootstrapHouseFill';
    }
  });

  onViewUnits(): void {
    this.viewUnits.emit(this.property().id);
  }
}
