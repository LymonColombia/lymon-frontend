import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Unit } from '@/domain/entities/staff.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapDropletFill,
  bootstrapPeopleFill,
  bootstrapSuitcaseLgFill,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-unit-card',
  standalone: true,
  imports: [DecimalPipe, NgIcon],
  providers: [
    provideIcons({ bootstrapDropletFill, bootstrapPeopleFill, bootstrapSuitcaseLgFill }),
  ],
  templateUrl: './unit-card.component.html',
  styleUrl: './unit-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitCardComponent {
  readonly unit = input.required<Unit>();

  readonly visibleAmenities = computed(() => this.unit().amenities?.slice(0, 4) ?? []);

  readonly hiddenAmenitiesCount = computed(() => {
    const totalAmenities = this.unit().amenities?.length ?? 0;
    return Math.max(totalAmenities - 4, 0);
  });
}
