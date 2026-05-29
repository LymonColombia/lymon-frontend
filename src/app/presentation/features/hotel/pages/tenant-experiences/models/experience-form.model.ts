import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { ExperienceAvailabilityType, ExperienceScope } from '@/domain/entities/experience.model';

export interface DayOption {
  value: number;
  label: string;
}

export interface BlackoutRangeFormControls {
  startAt: FormControl<string|null>;
  endAt: FormControl<string|null>;
}

export interface RecurrenceFormControls {
  daysOfWeek: FormControl<number[]>;
  startTime:  FormControl<string>;
  endTime: FormControl<string>;
}

export interface LocationFormControls {
  label: FormControl<string>;
  address: FormControl<string>;
}

export interface ExperienceFormControls {
  scope: FormControl<ExperienceScope>;
  propertyId: FormControl<string>;
  unitIds: FormControl<string[]>;
  name: FormControl<string>;
  description: FormControl<string>;
  category: FormControl<string>;
  priceCop: FormControl<number|undefined>;
  durationHours: FormControl<number|undefined>;
  capacity: FormControl<number|undefined>;
  coverImageUrl: FormControl<string>;
  availabilityType: FormControl<ExperienceAvailabilityType>;
  startAt: FormControl<string>;
  endAt: FormControl<string>;
  blackoutRanges: FormArray<FormGroup<BlackoutRangeFormControls>>;
  recurrence: FormGroup<RecurrenceFormControls>;
  location: FormGroup<LocationFormControls>;
}

export type ExperienceRecurrenceFormControls = RecurrenceFormControls;
export type ExperienceLocationFormControls = LocationFormControls;
