import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapClockFill,
  bootstrapGeoAltFill,
  bootstrapPeopleFill,
  bootstrapTagFill,
} from '@ng-icons/bootstrap-icons';

import { Experience } from '@/domain/entities/experience.model';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';

@Component({
  selector: 'app-experience-card',
  standalone: true,
  imports: [ButtonComponent, NgIcon],
  providers: [provideIcons({ bootstrapGeoAltFill, bootstrapTagFill, bootstrapClockFill, bootstrapPeopleFill })],
  templateUrl: './experience-card.component.html',
  styleUrl: './experience-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceCardComponent {
  readonly experience = input.required<Experience>();
  readonly view = output<string>();
  readonly edit = output<string>();

  readonly priceLabel = computed(() => this.formatCurrencyCop(this.experience().priceCop));
  readonly categoryLabel = computed(() => this.getCategoryLabel(this.experience().category));
  readonly scopeBadgeLabel = computed(() => this.getScopeBadgeLabel(this.experience().scope));
  readonly availabilitySummary = computed(() => this.getAvailabilitySummary(this.experience()));

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

  onDelete() {
    const id = this.experience().id;
    if (id) {
      this.edit.emit(id);
    }
  }

  private formatCurrencyCop(priceCop: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(priceCop);
  }

  private getCategoryLabel(category: string): string {
    const normalized = category.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private getScopeBadgeLabel(scope: Experience['scope']): string {
    return scope === 'PROPERTY' ? 'Propiedad' : 'Tenant';
  }

  private getAvailabilitySummary(experience: Experience): string {
    if (experience.availabilityType === 'DATE_RANGE') {
      return `${this.formatDateTime(experience.startAt)} - ${this.formatDateTime(experience.endAt)}`;
    }

    if (experience.availabilityType === 'ONE_TIME') {
      return this.formatDateTime(experience.startAt);
    }

    if (!experience.recurrence) {
      return 'Sin recurrencia';
    }

    return `${this.formatDaysOfWeek(experience.recurrence.daysOfWeek)} - ${experience.recurrence.startTime} a ${experience.recurrence.endTime}`;
  }

  private formatDateTime(value?: string): string {
    if (!value) {
      return 'Sin fecha';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  private formatDaysOfWeek(daysOfWeek: number[]): string {
    const dayLabelByIndex: Record<number, string> = {
      0: 'Dom',
      1: 'Lun',
      2: 'Mar',
      3: 'Mie',
      4: 'Jue',
      5: 'Vie',
      6: 'Sab',
    };

    return [...daysOfWeek]
      .sort((a, b) => a - b)
      .map((day) => dayLabelByIndex[day] ?? `${day}`)
      .join(', ');
  }
}
