import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Unit } from '@/domain/entities/staff.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapStar, bootstrapStarFill } from '@ng-icons/bootstrap-icons';
import { formatPrice } from '@/presentation/shared/utils/price-formatter';
import { ImageCarouselComponent } from '@/presentation/shared/components/image-carousel/image-carousel.component';

const TOTAL_STARS = 5;

@Component({
  selector: 'app-room-hero',
  standalone: true,
  imports: [NgIconComponent, ImageCarouselComponent],
  providers: [provideIcons({ bootstrapStarFill, bootstrapStar })],
  templateUrl: './room-hero.component.html',
  styleUrl: './room-hero.component.css',
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
