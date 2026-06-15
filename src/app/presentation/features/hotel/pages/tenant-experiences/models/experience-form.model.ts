import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { CreateExperienceDto, ExperienceAvailabilityType, ExperienceScope } from '@/domain/entities/experience.model';

export interface DayOption {
  value: number;
  label: string;
}

export const DAY_OPTIONS: readonly DayOption[] = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mie' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
];

export const DAY_LABEL_BY_VALUE: Readonly<Record<number, string>> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mie',
  4: 'Jue',
  5: 'Vie',
  6: 'Sab',
};

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
  lat: FormControl<number>; 
  lng: FormControl<number>;
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

export interface ExperienceFormSubmitPayload {
  experience: CreateExperienceDto;
  coverImageFile: File | null;
}

export function formatDayList(daysOfWeek: number[]): string {
  if (daysOfWeek.length === 0) {
    return 'Sin dias configurados';
  }

  return [...daysOfWeek]
    .sort((a, b) => a - b)
    .map((day) => DAY_LABEL_BY_VALUE[day] ?? `${day}`)
    .join(', ');
}
