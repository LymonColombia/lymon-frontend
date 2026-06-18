import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { GuestExperience } from '@/domain/entities/guest-experience.model';
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
  imports: [ButtonComponent, NgIcon],
  templateUrl: './experience-card.component.html',
  styleUrl: './experience-card.component.css',
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

  readonly imageUrl = computed(() => this.experience().coverImageUrl);
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
  readonly categoryLabel = computed(() => this.experience().category);

  onViewDetails(): void {
    this.viewDetails.emit(this.experience().id);
  }

  onToggleLike(): void {
    this.toggleLike.emit(this.experience().id);
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
}
