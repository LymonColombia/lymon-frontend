import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { BlackoutRange, Experience } from '@/domain/entities/experience.model';
import { BlackoutRangeFormControls } from '../../models/experience-form.model';

@Component({
  selector: 'app-experience-date-range-section',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './experience-date-range-section.component.html',
  styleUrl: './experience-date-range-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceDateRangeSectionComponent {
  readonly startAtControl = input<FormControl<string> | null>(null);
  readonly endAtControl = input<FormControl<string> | null>(null);
  readonly blackoutRanges = input<FormArray<FormGroup<BlackoutRangeFormControls>> | null>(null);
  readonly readonlyMode = input(false);
  readonly experience = input<Experience | null>(null);

  readonly addBlackout = output<void>();
  readonly removeBlackout = output<number>();

  onAddBlackout(): void {
    this.addBlackout.emit();
  }

  onRemoveBlackout(index: number): void {
    this.removeBlackout.emit(index);
  }

  getBlackoutValues(): BlackoutRange[] {
    return this.experience()?.blackoutRanges ?? [];
  }

  formatDateTime(value?: string): string {
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
}
