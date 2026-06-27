import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  Signal,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { formatPrice } from '@/presentation/shared/utils/price-formatter';
import {
  bootstrapGeoAlt,
  bootstrapPeopleFill,
  bootstrapStar,
  bootstrapStarFill,
} from '@ng-icons/bootstrap-icons';

export type RoomFeatureIconName =
  | 'extraSingleBed'
  | 'extraBath'
  | 'bootstrapPeopleFill';

export interface BookingRoomFeature {
  readonly label: string;
  readonly icon: RoomFeatureIconName;
}

export interface BookingRoomCard {
  readonly id: string;
  readonly title: string;
  readonly price: number;
  readonly description: string;
  readonly features: readonly BookingRoomFeature[];
  readonly amenities: readonly string[];
  readonly badgeLabel: string;
  readonly badgeVariant?: 'available' | 'shared' | 'last';
  readonly featured?: boolean;
  readonly imageUrl?: string;
  readonly rating?: number;
  readonly reviews?: number;
  readonly location?: string;
  readonly maxGuests?: number;
}

@Component({
  selector: 'booking-room-card',
  standalone: true,
  imports: [NgIcon],
  providers: [
    provideIcons({
      bootstrapPeopleFill,
      bootstrapStar,
      bootstrapStarFill,
      bootstrapGeoAlt,
    }),
  ],
  templateUrl: './room-card.component.html',
  styleUrl: './room-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomCardComponent implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  readonly room = input.required<BookingRoomCard>();
  readonly viewDetails = output<string>();

  private readonly amenitiesContainer = viewChild<ElementRef<HTMLElement>>('amenitiesContainer');
  private readonly moreEl = viewChild<ElementRef<HTMLElement>>('moreEl');

  private static readonly AMENITY_ROW_GAP_FALLBACK_PX = 4;

  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => {
      const container = this.amenitiesContainer()?.nativeElement;
      if (!container) return;

      this.measureAmenities(container);

      this.resizeObserver = new ResizeObserver(() => this.measureAmenities(container));
      this.resizeObserver.observe(container);
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private measureAmenities(container: HTMLElement): void {
    const chips = Array.from(container.querySelectorAll<HTMLElement>('.amenity'));
    const more = this.moreEl()?.nativeElement;
    if (!chips.length || !more) return;

    // Phase 1: show all chips, hide +n, no height cap
    chips.forEach(c => (c.style.display = ''));
    more.style.display = 'none';
    container.style.maxHeight = 'none';

    const gap = Number.parseFloat(getComputedStyle(container).rowGap) || RoomCardComponent.AMENITY_ROW_GAP_FALLBACK_PX;
    const chipHeight = chips[0].offsetHeight;
    const twoRowCutoff = chips[0].offsetTop + chipHeight * 2 + gap;

    // Find first chip that overflows 2 rows
    let overflowStartIndex = chips.length;
    for (let i = 0; i < chips.length; i++) {
      if (chips[i].offsetTop + chips[i].offsetHeight > twoRowCutoff + 1) {
        overflowStartIndex = i;
        break;
      }
    }

    if (overflowStartIndex === chips.length) {
      // All chips fit — no +n needed
      container.style.maxHeight = `${chipHeight * 2 + gap}px`;
      return;
    }

    // Hide overflowing chips, show +n on last visible row
    const hiddenCount = chips.length - overflowStartIndex;
    for (let i = overflowStartIndex; i < chips.length; i++) {
      chips[i].style.display = 'none';
    }
    more.textContent = `+${hiddenCount}`;
    more.style.display = 'flex';

    // If +n itself spills to a 3rd row, remove the last visible chip to make room
    if (more.offsetTop + more.offsetHeight > twoRowCutoff + 1 && overflowStartIndex > 0) {
      chips[overflowStartIndex - 1].style.display = 'none';
      more.textContent = `+${hiddenCount + 1}`;
    }

    container.style.maxHeight = `${chipHeight * 2 + gap}px`;
  }

  private loadSvg(name: string): Signal<SafeHtml> {
    return toSignal(
      this.http
        .get(`/extra-icons/${name}.svg`, { responseType: 'text' })
        .pipe(map((svg) => this.sanitizer.bypassSecurityTrustHtml(svg))),
      { initialValue: '' as unknown as SafeHtml }
    );
  }

  private readonly singleBedSvg = this.loadSvg('single-bed');
  private readonly bathSvg = this.loadSvg('bath');

  private readonly FEATURE_SVG_MAP: Record<string, () => SafeHtml> = {
    extraSingleBed: () => this.singleBedSvg(),
    extraBath: () => this.bathSvg(),
  };

  protected getFeatureSvg(icon: RoomFeatureIconName): SafeHtml | null {
    return this.FEATURE_SVG_MAP[icon]?.() ?? null;
  }

  protected getStars(): boolean[] {
    const rating = this.room().rating;
    if (rating === undefined || rating === null) return [];
    return Array.from({ length: 5 }, (_, i) => i < rating);
  }

  protected onCardClick(): void {
    this.viewDetails.emit(this.room().id);
  }

  protected readonly formatPrice = formatPrice;

}
