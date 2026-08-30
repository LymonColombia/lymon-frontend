import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { PropertyType, Property } from '@/domain/shared/property/property.model';
import { NgIcon, provideIcons } from '@ng-icons/core';

const PROPERTY_CARD_LABELS: Record<PropertyType, string> = {
  HOTEL: 'Hotel',
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  VILLA: 'Villa',
  HOSTAL: 'Hostal',
  GLAMPING: 'Glamping',
  RURAL: 'Rural',
  CASA_DE_CAMPO: 'Casa de campo',
  FINCA: 'Finca',
  APARTAHOTEL: 'Apartahoteles',
};
import {
  bootstrapBuildingFill,
  bootstrapBuildingsFill,
  bootstrapBoxSeam,
  bootstrapDoorOpenFill,
  bootstrapGeoAltFill,
  bootstrapHouseDoorFill,
  bootstrapHouseFill,
  bootstrapPencilSquare,
  bootstrapThreeDotsVertical,
  bootstrapTrashFill,
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
      bootstrapBoxSeam,
      bootstrapBuildingFill,
      bootstrapBuildingsFill,
      bootstrapDoorOpenFill,
      bootstrapGeoAltFill,
      bootstrapHouseDoorFill,
      bootstrapHouseFill,
      bootstrapPencilSquare,
      bootstrapThreeDotsVertical,
      bootstrapTrashFill,
      bootstrapTreeFill,
    }),
  ],
  templateUrl: './property-card.html',
  styleUrl: './property-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyCardComponent {
  readonly property = input.required<Property>();
  readonly viewUnits = output<string>();
  readonly viewInventory = output<string>();
  readonly edit = output<Property>();
  readonly delete = output<Property>();

  readonly menuOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.property-menu-wrapper')) {
      this.menuOpen.set(false);
    }
  }

  readonly propertyTypeLabel = computed(() => {
    const rawType = this.property().propertyType;
    if (!rawType) {
      return '';
    }

    return PROPERTY_CARD_LABELS[rawType as PropertyType] ?? rawType;
  });

  readonly propertyTypeIcon = computed<PropertyIconName>(() => {
    switch (this.property().propertyType) {
      case 'HOTEL':
        return 'bootstrapBuildingsFill';
      case 'APARTAMENTO':
      case 'HOSTAL':
      case 'APARTAHOTEL':
        return 'bootstrapBuildingFill';
      case 'VILLA':
        return 'bootstrapHouseDoorFill';
      case 'GLAMPING':
      case 'RURAL':
      case 'CASA_DE_CAMPO':
      case 'FINCA':
        return 'bootstrapTreeFill';
      case 'CASA':
      default:
        return 'bootstrapHouseFill';
    }
  });

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen.update(open => !open);
  }

  onViewUnits(): void {
    this.viewUnits.emit(this.property().id);
  }

  onEdit(): void {
    this.menuOpen.set(false);
    this.edit.emit(this.property());
  }

  onDelete(): void {
    this.menuOpen.set(false);
    this.delete.emit(this.property());
  }

  onViewInventory(): void {
    this.viewInventory.emit(this.property().id);
  }
}
