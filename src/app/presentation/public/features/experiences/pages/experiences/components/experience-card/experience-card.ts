import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { GuestExperience } from '@/domain/guest/guest-experience/guest-experience.model';
import { coverImageOf } from '@/presentation/shared/utils/media.util';
import {
  bootstrapAward,
  bootstrapClock,
  bootstrapGeoAlt,
  bootstrapHeart,
  bootstrapHeartFill,
  bootstrapPatchCheckFill,
  bootstrapPeopleFill,
  bootstrapStarFill,
} from '@ng-icons/bootstrap-icons';


@Component({
  selector: 'experience-card',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './experience-card.html',
  styleUrl: './experience-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      bootstrapHeart,
      bootstrapHeartFill,
      bootstrapGeoAlt,
      bootstrapStarFill,
      bootstrapClock,
      bootstrapPeopleFill,
      bootstrapPatchCheckFill,
      bootstrapAward,
    }),
  ],
})
export class ExperienceCardComponent {
  readonly experience = input.required<GuestExperience>();
  readonly isLiked = input<boolean>(false);
  readonly viewDetails = output<string>();
  readonly toggleLike = output<string>();

  private readonly titleMaxChars = 25;
  private readonly descriptionMaxChars = 80;

  readonly imageUrl = computed(() => coverImageOf(this.experience().mediaUrls));
  readonly titleLabel = computed(() => this.experience().name);
  readonly locationLabel = computed(() => {
    const location = this.experience().location;
    return location.label?.trim() || location.address?.trim() || 'Ubicacion no disponible';
  });

  readonly priceLabel = computed(() =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(this.experience().priceCop),
  );

  readonly durationLabel = computed(() => `${this.experience().durationHours} hora${this.experience().durationHours === 1 ? '' : 's'}`);
  readonly capacityLabel = computed(() => `Max. ${this.experience().capacity} persona${this.experience().capacity === 1 ? '' : 's'}`);
  readonly hostCertified = computed(() => this.experience().scope === 'PROPERTY');
  readonly categoryLabel = computed(() => this.getCategoryLabel(this.experience().category));

  onToggleLike(event: Event): void {
    event.stopPropagation();
    this.toggleLike.emit(this.experience().id);
  }

  onCardClick(): void {
    this.viewDetails.emit(this.experience().id);
  }

  truncateText(text: string | null | undefined, maxChars: number): string {
    if (!text) {
      return '';
    }

    const normalized = text.trim();
    if (normalized.length <= maxChars) {
      return normalized;
    }

    return `${normalized.slice(0, maxChars).trimEnd()}...`;
  }

  getTitlePreview(): string {
    return this.truncateText(this.experience().name, this.titleMaxChars);
  }

  getDescriptionPreview(): string {
    return this.truncateText(this.experience().description, this.descriptionMaxChars);
  }

  private getCategoryLabel(category: string): string {
    const normalized = category.trim().toUpperCase();

    if (normalized === 'TRANSPORTATION') {
      return 'Transporte';
    }

    const fallback = normalized.toLowerCase();
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
  }
}
