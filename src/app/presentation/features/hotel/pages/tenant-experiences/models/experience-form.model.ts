import { FormArray, FormControl, FormGroup } from '@angular/forms';

export interface DayOption {
  value: number;
  label: string;
}

export interface BlackoutRangeFormControls {
  startAt: FormControl<string>;
  endAt: FormControl<string>;
}

export interface ExperienceRecurrenceFormControls {
  daysOfWeek: FormControl<number[]>;
  startTime: FormControl<string>;
  endTime: FormControl<string>;
}

export interface ExperienceLocationFormControls {
  label: FormControl<string>;
  address: FormControl<string>;
  lat: FormControl<number | null>;
  lng: FormControl<number | null>;
}

export interface ExperienceFormControls {
  scope: FormControl<'PROPERTY' | 'TENANT'>;
  propertyId: FormControl<string>;
  unitIds: FormControl<string[]>;
  name: FormControl<string>;
  description: FormControl<string>;
  category: FormControl<string>;
  priceCop: FormControl<number | null>;
  durationHours: FormControl<number | null>;
  capacity: FormControl<number | null>;
  coverImageUrl: FormControl<string>;
  availabilityType: FormControl<'DATE_RANGE' | 'RECURRING'>;
  startAt: FormControl<string>;
  endAt: FormControl<string>;
  blackoutRanges: FormArray<FormGroup<BlackoutRangeFormControls>>;
  recurrence: FormGroup<ExperienceRecurrenceFormControls>;
  location: FormGroup<ExperienceLocationFormControls>;
}

