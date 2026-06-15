import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Experience } from '@/domain/entities/experience.model';
import { provideIcons, NgIcon } from "@ng-icons/core";
import {  bootstrapTrash ,bootstrapEye, bootstrapPencilSquare} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-experience-table',
  standalone: true,
  templateUrl: './experience-table.component.html',
  styleUrl: './experience-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ bootstrapTrash , bootstrapEye,bootstrapPencilSquare })],
})
export class ExperienceTableComponent {

  readonly experiences = input.required<Experience[]>();
  readonly view = output<string>();
  readonly edit = output<string>();
  readonly delete = output<string>();

  onView(id: string | undefined): void {
    if (id) {
      this.view.emit(id);
    }
  }

  onEdit(id: string | undefined): void {
    if (id) {
      this.edit.emit(id);
    }
  }

  onDelete(id: string | undefined): void {
    if (id) {
      this.delete.emit(id);
    }
  }

  formatCurrencyCop(priceCop: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(priceCop);
  }

  getCategoryLabel(category: string): string {
    const normalized = category.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  getScopeBadgeLabel(scope: Experience['scope']): string {
    return scope === 'PROPERTY' ? 'Propiedad' : 'Tenant';
  }

  getAvailabilitySummary(experience: Experience): string {
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
