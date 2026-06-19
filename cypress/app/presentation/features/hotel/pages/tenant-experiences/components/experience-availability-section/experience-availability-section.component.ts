import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Experience } from '@/domain/entities/experience.model';
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
  readonly availabilityType = input<'DATE_RANGE' | 'RECURRING' | 'ONE_TIME'>('RECURRING');
  readonly experience = input<Experience | null>(null);
  readonly readonlyMode = input(false);

  readonly addBlackoutRange = output<void>();
  readonly removeBlackoutRange = output<number>();

  readonly showDateRange = computed(
    () => this.availabilityType() === 'DATE_RANGE' || this.availabilityType() === 'ONE_TIME',
  );
  readonly showRecurrence = computed(() => this.availabilityType() === 'RECURRING');

  readonly dateBasedExperience = computed<Experience | null>(() => {
    const value = this.experience();
    if (!value) {
      return null;
    }

    if (value.availabilityType !== 'DATE_RANGE' && value.availabilityType !== 'ONE_TIME') {
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
