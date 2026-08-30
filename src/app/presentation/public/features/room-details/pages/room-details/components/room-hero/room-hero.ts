import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Unit } from '@/domain/entities/property.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapStar, bootstrapStarFill } from '@ng-icons/bootstrap-icons';
import { formatPrice } from '@/presentation/shared/utils/price-formatter';
import { ImageCarouselComponent } from '@/presentation/public/components/image-carousel/image-carousel';

const TOTAL_STARS = 5;

@Component({
  selector: 'app-room-hero',
  standalone: true,
  imports: [NgIconComponent, ImageCarouselComponent],
  providers: [provideIcons({ bootstrapStarFill, bootstrapStar })],
  templateUrl: './room-hero.html',
  styleUrl: './room-hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomHeroComponent {
  readonly unit = input.required<Unit>();
  readonly viewRatings = output<void>();

  protected getStars(): boolean[] {
    const rating = this.unit().rating ?? 0;
    return Array.from({ length: TOTAL_STARS }, (_, i) => i < rating);
  }

  protected readonly formatPrice = formatPrice;
}
