import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Unit } from '@/domain/entities/staff.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapPeople } from '@ng-icons/bootstrap-icons';

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
  templateUrl: './room-general-info.component.html',
  styleUrl: './room-general-info.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomGeneralInfoComponent {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

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

  private loadSvg(name: string) {
    return toSignal(
      this.http.get(`/extra-icons/${name}.svg`, { responseType: 'text' }).pipe(
        map((svg) => this.sanitizer.bypassSecurityTrustHtml(svg))
      ),
      { initialValue: '' as unknown as SafeHtml }
    );
  }

  protected readonly bathIcon = this.loadSvg('bath');
  protected readonly singleBedIcon = this.loadSvg('single-bed');
  private readonly doubleBedIcon = this.loadSvg('double-bed');
  private readonly kingBedIcon = this.loadSvg('king-bed');
  private readonly sofaBedIcon = this.loadSvg('sofa-bed');

  private readonly BED_ICON_MAP: Record<string, () => SafeHtml> = {
    SINGLE: () => this.singleBedIcon(),
    TWIN: () => this.singleBedIcon(),
    BUNK: () => this.singleBedIcon(),
    DOUBLE: () => this.doubleBedIcon(),
    KING: () => this.kingBedIcon(),
    QUEEN: () => this.kingBedIcon(),
    SOFA_BED: () => this.sofaBedIcon(),
  };

  protected getBedIcon(type: string): SafeHtml {
    return (this.BED_ICON_MAP[type] ?? (() => this.singleBedIcon()))();
  }
}
