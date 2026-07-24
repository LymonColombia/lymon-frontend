import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapGeoAltFill,
  bootstrapPeopleFill,
  bootstrapThreeDotsVertical,
  bootstrapTagFill,
  bootstrapPencilSquare,
  bootstrapTrash,
} from '@ng-icons/bootstrap-icons';

import { getAvailabilitySummary } from '../../models/experience-form.model';
import { Experience } from '@/domain/entities/experience.model';
import { coverImageOf } from '@/presentation/shared/utils/media.util';
import { formatPrice } from '@/presentation/shared/utils/price-formatter';
import { getCategoryLabel } from '@/presentation/shared/utils/category-experience-formatter';

@Component({
  selector: 'app-experience-card',
  standalone: true,
  imports: [NgIcon],
  providers: [
    provideIcons({
      bootstrapGeoAltFill,
      bootstrapTagFill,
      bootstrapPeopleFill,
      bootstrapThreeDotsVertical,
      bootstrapPencilSquare,
      bootstrapTrash,
    }),
  ],
  templateUrl: './experience-card.component.html',
  styleUrl: './experience-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceCardComponent {
  readonly experience = input.required<Experience>();
  readonly view = output<string>();
  readonly edit = output<string>();
  readonly delete = output<string>();

  readonly isActionsOpen = signal(false);
  readonly imageUrl = computed(() => coverImageOf(this.experience().mediaUrls));
  readonly priceLabel = computed(() => `$${formatPrice(this.experience().priceCop)}`);
  readonly categoryLabel = computed(() => getCategoryLabel(this.experience().category));
  readonly availabilitySummary = computed(() => getAvailabilitySummary(this.experience()));

  onCardActivate(): void {
    if (this.isActionsOpen()) {
      return;
    }

    const id = this.experience().id;
    if (id) {
      this.view.emit(id);
    }
  }

  onEdit(): void {
    const id = this.experience().id;
    if (id) {
      this.isActionsOpen.set(false);
      this.edit.emit(id);
    }
  }

  onDelete(): void {
    const id = this.experience().id;
    if (id) {
      this.isActionsOpen.set(false);
      this.delete.emit(id);
    }
  }

  toggleActions(event: MouseEvent): void {
    event.stopPropagation();
    this.isActionsOpen.update((value) => !value);
  }

  closeActions(event?: Event): void {
    event?.stopPropagation();
    this.isActionsOpen.set(false);
  }

}
