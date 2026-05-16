import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ExperienceLocation } from '@/domain/entities/experience.model';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { ExperienceLocationFormControls } from '../../models/experience-form.model';

@Component({
  selector: 'app-experience-location-section',
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent],
  templateUrl: './experience-location-section.component.html',
  styleUrl: './experience-location-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceLocationSectionComponent {
  readonly locationForm = input<FormGroup<ExperienceLocationFormControls> | null>(null);
  readonly location = input<ExperienceLocation | null>(null);
  readonly readonlyMode = input(false);
}
