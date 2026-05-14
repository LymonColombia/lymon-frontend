import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
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
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyCardComponent {
  readonly property = input.required<Property>();
  readonly viewUnits = output<string>();
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
}
