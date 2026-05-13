import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { Experience, PropertyExperience } from '@/domain/entities/experience.model';
import { ExperienceFormControls } from '../../models/experience-form.model';
import { ExperienceDateRangeSectionComponent } from '../experience-date-range-section/experience-date-range-section.component';
import { ExperienceRecurrenceSectionComponent } from '../experience-recurrence-section/experience-recurrence-section.component';

@Component({
  selector: 'app-experience-availability-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ExperienceDateRangeSectionComponent,
    ExperienceRecurrenceSectionComponent,
  ],
  templateUrl: './experience-availability-section.component.html',
  styleUrl: './experience-availability-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceAvailabilitySectionComponent {
  readonly form = input<FormGroup<ExperienceFormControls> | null>(null);
  readonly scope = input<'PROPERTY' | 'TENANT'>('TENANT');
  readonly availabilityType = input<'DATE_RANGE' | 'RECURRING'>('RECURRING');
  readonly experience = input<Experience | null>(null);
  readonly readonlyMode = input(false);

  readonly addBlackoutRange = output<void>();
  readonly removeBlackoutRange = output<number>();

  readonly showDateRange = computed(() => this.availabilityType() === 'DATE_RANGE');
  readonly showRecurrence = computed(() => this.availabilityType() === 'RECURRING');

  readonly propertyExperience = computed<PropertyExperience | null>(() => {
    const value = this.experience();
    if (value?.scope !== 'PROPERTY' || value.availabilityType !== 'DATE_RANGE') {
      return null;
    }

    return value;
  });

  onAddBlackoutRange(): void {
    this.addBlackoutRange.emit();
  }

  onRemoveBlackoutRange(index: number): void {
    this.removeBlackoutRange.emit(index);
  }
}
