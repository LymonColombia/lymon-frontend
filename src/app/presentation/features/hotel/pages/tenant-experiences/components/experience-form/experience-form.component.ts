import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ExperienceFormControls } from '../../models/experience-form.model';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { ExperienceLocationSectionComponent } from '../experience-location-section/experience-location-section.component';
import { ExperienceAvailabilitySectionComponent } from '../experience-availability-section/experience-availability-section.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapStars } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-experience-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
    ExperienceLocationSectionComponent,
    ExperienceAvailabilitySectionComponent,
    NgIcon,
  ],
  providers: [provideIcons({ bootstrapStars })],
  templateUrl: './experience-form.component.html',
  styleUrl: './experience-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceFormComponent {
  readonly form = input.required<FormGroup<ExperienceFormControls>>();
  readonly scopeOptions = input.required<SelectOption[]>();
  readonly categoryOptions = input.required<SelectOption[]>();
  readonly propertyOptions = input.required<SelectOption[]>();
  readonly availabilityTypeOptions = input.required<SelectOption[]>();
  readonly unitOptions = input.required<SelectOption[]>();
  readonly unitsLoading = input(false);

  readonly propertyChanged = output<string>();
  readonly addBlackoutRange = output<void>();
  readonly removeBlackoutRange = output<number>();

  get isPropertyScope(): boolean {
    return this.form().controls.scope.value === 'PROPERTY';
  }

  get isTenantScope(): boolean {
    return this.form().controls.scope.value === 'TENANT';
  }

  onPropertyChanged(value: string | number): void {
    this.propertyChanged.emit(String(value));
  }

  onUnitChecklistToggle(unitId: string, checked: boolean): void {
    const current = this.form().controls.unitIds.value;
    const next = checked ? [...new Set([...current, unitId])] : current.filter((value) => value !== unitId);
    this.form().controls.unitIds.setValue(next);
    this.form().controls.unitIds.markAsTouched();
    this.form().controls.unitIds.updateValueAndValidity();
  }

  isUnitSelected(unitId: string): boolean {
    return this.form().controls.unitIds.value.includes(unitId);
  }

  onAddBlackoutRange(): void {
    this.addBlackoutRange.emit();
  }

  onRemoveBlackoutRange(index: number): void {
    this.removeBlackoutRange.emit(index);
  }

  onCoverImageSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      this.form().controls.coverImageUrl.setValue(result);
      this.form().controls.coverImageUrl.markAsTouched();
      this.form().controls.coverImageUrl.updateValueAndValidity();
    };
    reader.readAsDataURL(file);
  }
}
