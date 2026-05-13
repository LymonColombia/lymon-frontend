import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ExperienceCard } from '@/domain/entities/experience.model';
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
  readonly experience = input.required<ExperienceCard>();
  readonly isLiked = input<boolean>(false);
  readonly viewDetails = output<string>();
  readonly toggleLike = output<string>();

  private readonly titleMaxChars = 30;
  private readonly descriptionMaxChars = 130;

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
    return this.truncateText(this.experience().title, this.titleMaxChars);
  }

  getDescriptionPreview(): string {
    return this.truncateText(this.experience().description, this.descriptionMaxChars);
  }
}
