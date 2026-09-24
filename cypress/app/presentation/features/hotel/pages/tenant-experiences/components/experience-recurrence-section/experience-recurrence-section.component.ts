import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ExperienceRecurrence } from '@/domain/entities/experience.model';
import { DayOption, ExperienceRecurrenceFormControls } from '../../models/experience-form.model';

@Component({
  selector: 'app-experience-recurrence-section',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './experience-recurrence-section.component.html',
  styleUrl: './experience-recurrence-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceRecurrenceSectionComponent {
  readonly recurrenceForm = input<FormGroup<ExperienceRecurrenceFormControls> | null>(null);
  readonly recurrence = input<ExperienceRecurrence | null>(null);
  readonly readonlyMode = input(false);

  readonly dayOptions: DayOption[] = [
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mie' },
    { value: 4, label: 'Jue' },
    { value: 5, label: 'Vie' },
    { value: 6, label: 'Sab' },
    { value: 0, label: 'Dom' },
  ];

  readonly hasForm = computed(() => Boolean(this.recurrenceForm()));

  readonly recurrenceSummary = computed(() => {
    const value = this.recurrence();
    if (!value) {
      return 'No configurado';
    }

    return `${this.formatDaysOfWeek(value.daysOfWeek)} - ${value.startTime} a ${value.endTime}`;
  });

  isDaySelected(day: number): boolean {
    const form = this.recurrenceForm();
    if (!form) {
      return false;
    }

    return form.controls.daysOfWeek.value.includes(day);
  }

  toggleDay(day: number): void {
    const form = this.recurrenceForm();
    if (!form || this.readonlyMode()) {
      return;
    }

    const current = form.controls.daysOfWeek.value;
    const next = current.includes(day) ? current.filter((value) => value !== day) : [...current, day];
    form.controls.daysOfWeek.setValue(next);
    form.controls.daysOfWeek.markAsTouched();
    form.controls.daysOfWeek.updateValueAndValidity();
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

    if (daysOfWeek.length === 0) {
      return 'Sin dias configurados';
    }

    return [...daysOfWeek]
      .sort((a, b) => a - b)
      .map((day) => dayLabelByIndex[day] ?? `${day}`)
      .join(', ');
  }
}
