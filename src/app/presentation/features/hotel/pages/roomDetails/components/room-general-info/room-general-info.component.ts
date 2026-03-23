import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Unit } from '@/domain/entities/staff.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapDoorOpen,
  bootstrapHouseDoor,
  bootstrapPeople,
  bootstrapPeopleFill,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-room-general-info',
  standalone: true,
  imports: [NgIconComponent],
  providers: [provideIcons({ bootstrapDoorOpen, bootstrapHouseDoor, bootstrapPeople, bootstrapPeopleFill })],
  templateUrl: './room-general-info.component.html',
  styleUrl: './room-general-info.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomGeneralInfoComponent {
  readonly unit = input.required<Unit>();

  readonly maxGuestsLabel = computed(() => {
    const maxGuests = this.unit().maxGuests ?? 0;
    return `${maxGuests} Persona${maxGuests === 1 ? '' : 's'}`;
  });

  readonly standardGuestsLabel = computed(() => {
    const standardGuests = this.unit().standardGuests ?? 0;
    return `${standardGuests} Persona${standardGuests === 1 ? '' : 's'}`;
  });

  readonly bathroomsLabel = computed(() => {
    const bathroomsCount = this.unit().bathroomsCount ?? 0;
    return `${bathroomsCount} baño${bathroomsCount === 1 ? '' : 's'}`;
  });

  readonly bedsLabel = computed(() => {
    const beds = this.unit().bedrooms?.flatMap((bedroom) => bedroom.beds ?? []) ?? [];

    if (beds.length === 0) {
      return 'Sin información';
    }

    const totalBeds = beds.reduce((sum, bed) => sum + (bed.count ?? 0), 0);
    return `${totalBeds} cama${totalBeds === 1 ? '' : 's'}`;
  });
}
