import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Unit } from '@/domain/entities/staff.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapDroplet,
  bootstrapMoonStars,
  bootstrapPeople,
} from '@ng-icons/bootstrap-icons';

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
  providers: [provideIcons({ bootstrapDroplet, bootstrapMoonStars, bootstrapPeople })],
  templateUrl: './room-general-info.component.html',
  styleUrl: './room-general-info.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomGeneralInfoComponent {
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

  // TODO LYMON-1070: replace placeholder with type-specific bed icons
  private readonly BED_ICON_MAP: Record<string, string> = {
    KING: 'bootstrapMoonStars',
    QUEEN: 'bootstrapMoonStars',
    DOUBLE: 'bootstrapMoonStars',
    SINGLE: 'bootstrapMoonStars',
    SOFA_BED: 'bootstrapMoonStars',
    TWIN: 'bootstrapMoonStars',
    BUNK: 'bootstrapMoonStars',
  };

  protected getBedIcon(type: string): string {
    return this.BED_ICON_MAP[type] ?? 'bootstrapMoonStars';
  }
}
