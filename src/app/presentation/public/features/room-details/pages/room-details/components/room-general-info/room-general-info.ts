import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Unit } from '@/domain/entities/property.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapPeople } from '@ng-icons/bootstrap-icons';

const SINGLE_BED_ICON = 'single-bed';

const BED_ICON_MAP: Record<string, string> = {
  SINGLE: SINGLE_BED_ICON,
  TWIN: SINGLE_BED_ICON,
  BUNK: SINGLE_BED_ICON,
  DOUBLE: 'double-bed',
  KING: 'king-bed',
  QUEEN: 'king-bed',
  SOFA_BED: 'sofa-bed',
};

const BED_LABELS: Record<string, string> = {
  KING: 'King',
  QUEEN: 'Queen',
  DOUBLE: 'Doble',
  SINGLE: 'Individual',
  SOFA_BED: 'Sofá cama',
  TWIN: 'Gemela',
  BUNK: 'Litera',
};

interface BedSummary {
  type: string;
  label: string;
  count: number;
}

@Component({
  selector: 'app-room-general-info',
  standalone: true,
  imports: [NgIconComponent],
  providers: [provideIcons({ bootstrapPeople })],
  templateUrl: './room-general-info.html',
  styleUrl: './room-general-info.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomGeneralInfoComponent {
  protected readonly bathIcon = 'bath';
  protected readonly singleBedIcon = SINGLE_BED_ICON;

  readonly unit = input.required<Unit>();

  readonly maxGuests = computed(() => this.unit().maxGuests ?? 0);

  readonly bathroomsCount = computed(() => this.unit().bathroomsCount ?? 0);

  readonly bathroomLabel = computed(() =>
    this.bathroomsCount() === 1 ? 'Baño' : 'Baños'
  );

  readonly bedBreakdown = computed((): BedSummary[] => {
    const beds = this.unit().bedrooms?.flatMap((bedroom) => bedroom.beds ?? []) ?? [];
    const grouped: Record<string, number> = {};

    for (const bed of beds) {
      grouped[bed.type] = (grouped[bed.type] ?? 0) + bed.count;
    }

    return Object.entries(grouped)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        type,
        label: BED_LABELS[type] ?? type,
        count,
      }));
  });

  readonly totalBeds = computed(() =>
    this.bedBreakdown().reduce((sum, b) => sum + b.count, 0)
  );

  protected getBedIcon(type: string): string {
    return BED_ICON_MAP[type] ?? SINGLE_BED_ICON;
  }
}
