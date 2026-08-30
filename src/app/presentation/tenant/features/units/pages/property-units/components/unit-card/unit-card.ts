import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Unit } from '@/domain/entities/property.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapDropletFill,
  bootstrapPeopleFill,
  bootstrapPencilSquare,
  bootstrapSuitcaseLgFill,
  bootstrapThreeDotsVertical,
  bootstrapTrashFill,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-unit-card',
  standalone: true,
  imports: [DecimalPipe, NgIcon],
  providers: [
    provideIcons({
      bootstrapDropletFill,
      bootstrapPeopleFill,
      bootstrapPencilSquare,
      bootstrapSuitcaseLgFill,
      bootstrapThreeDotsVertical,
      bootstrapTrashFill,
    }),
  ],
  templateUrl: './unit-card.html',
  styleUrl: './unit-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitCardComponent {
  private static readonly MENU_WRAPPER_SELECTOR = '.unit-menu-wrapper';

  readonly unit = input.required<Unit>();
  readonly edit = output<Unit>();
  readonly deleteUnit = output<Unit>();
  readonly menuOpen = signal(false);

  readonly visibleAmenities = computed(() => this.unit().amenities?.slice(0, 4) ?? []);

  readonly hiddenAmenitiesCount = computed(() => {
    const totalAmenities = this.unit().amenities?.length ?? 0;
    return Math.max(totalAmenities - 4, 0);
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    const target = event.target as HTMLElement;
    if (!target.closest(UnitCardComponent.MENU_WRAPPER_SELECTOR)) {
      this.menuOpen.set(false);
    }
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen.update(open => !open);
  }

  onEdit(): void {
    this.menuOpen.set(false);
    this.edit.emit(this.unit());
  }

  onDelete(): void {
    this.menuOpen.set(false);
    this.deleteUnit.emit(this.unit());
  }
}
