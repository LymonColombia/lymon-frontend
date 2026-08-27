import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapClockFill,
  bootstrapGeoAltFill,
  bootstrapPeopleFill,
  bootstrapTagFill,
  bootstrapEye,
  bootstrapPencilSquare,
  bootstrapTrash
} from '@ng-icons/bootstrap-icons';

import { formatCurrencyCop,getCategoryLabel,getScopeBadgeLabel,getAvailabilitySummary } from '../../models/experience-form.model';
import { Experience } from '@/domain/entities/experience.model';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { coverImageOf } from '@/presentation/shared/utils/media.util';

@Component({
  selector: 'app-experience-card',
  standalone: true,
  imports: [ButtonComponent, NgIcon],
  providers: [provideIcons({ bootstrapGeoAltFill, bootstrapTagFill, bootstrapClockFill, bootstrapPeopleFill,bootstrapEye, bootstrapPencilSquare, bootstrapTrash })],
  templateUrl: './experience-card.html',
  styleUrl: './experience-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceCardComponent {
  readonly experience = input.required<Experience>();
  readonly view = output<string>();
  readonly edit = output<string>();
  readonly delete = output<string>();

  readonly imageUrl = computed(() => coverImageOf(this.experience().mediaUrls));
  readonly priceLabel = computed(() => formatCurrencyCop(this.experience().priceCop));
  readonly categoryLabel = computed(() => getCategoryLabel(this.experience().category));
  readonly scopeBadgeLabel = computed(() => getScopeBadgeLabel(this.experience().scope));
  readonly availabilitySummary = computed(() => getAvailabilitySummary(this.experience()));

  onView(): void {
    const id = this.experience().id;
    if (id) {
      this.view.emit(id);
    }
  }

  onEdit(): void {
    const id = this.experience().id;
    if (id) {
      this.edit.emit(id);
    }
  }

  onDelete(): void {
    const id = this.experience().id;
    if (id) {
      this.delete.emit(id);
    }
  }

}
