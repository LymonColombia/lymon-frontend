import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MediaItem } from '@/domain/entities/storage.model';
import { CreateExperienceDto, Experience, ExperienceAvailabilityType } from '@/domain/entities/experience.model';
import type { AddressLocationValue } from '@/presentation/shared/components/address-map-picker/address-map-picker.component';

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

export interface ExperienceFormControls {
  propertyId: FormControl<string>;
  unitIds: FormControl<string[]>;
  name: FormControl<string>;
  description: FormControl<string>;
  category: FormControl<string>;
  priceCop: FormControl<number|undefined>;
  durationHours: FormControl<number|undefined>;
  capacity: FormControl<number|undefined>;
  minimumParticipants: FormControl<number|undefined>;
  availabilityType: FormControl<ExperienceAvailabilityType>;
  startAt: FormControl<string>;
  endAt: FormControl<string>;
  blackoutRanges: FormArray<FormGroup<BlackoutRangeFormControls>>;
  recurrence: FormGroup<RecurrenceFormControls>;
  locationLabel: FormControl<string>;
  location: FormControl<AddressLocationValue | null>;
}

export interface ExperienceFormSubmitPayload {
  experience: CreateExperienceDto;
  /** A freshly picked cover file (its key becomes mediaKeys[0]), or null when unchanged. */
  coverImageFile: File | null;
  /** Existing cover key (mediaKeys[0]) reused on edit when no new cover file was picked. */
  existingCoverKey: string | null;
  /** Existing gallery photos the user kept (their keys survive the replace-all write). */
  keptMediaItems: MediaItem[];
  /** Newly picked gallery files still to be uploaded. */
  newMediaFiles: File[];
}

export const EXPERIENCE_CATEGORY_LABELS: Readonly<Record<string, string>> = {
  TRANSPORTATION: 'Transporte',
};

export function formatDayList(daysOfWeek: number[]): string {
  if (daysOfWeek.length === 0) {
    return 'Sin dias configurados';
  }

  return [...daysOfWeek]
    .sort((a, b) => a - b)
    .map((day) => DAY_LABEL_BY_VALUE[day] ?? `${day}`)
    .join(', ');
}

export function formatCurrencyCop(priceCop: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(priceCop);
}

export function getCategoryLabel(category: string): string {
  const normalized = category.trim().toUpperCase();
  return EXPERIENCE_CATEGORY_LABELS[normalized] ?? normalized.charAt(0) + normalized.slice(1).toLowerCase();
}


export function formatDateTime(value?: string): string {
  if (!value) return 'Sin fecha';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function getAvailabilitySummary(experience: Experience): string {
  if (experience.availabilityType === 'DATE_RANGE') {
    return `${formatDateTime(experience.startAt)} - ${formatDateTime(experience.endAt)}`;
  }

  if (experience.availabilityType === 'ONE_TIME') {
    return formatDateTime(experience.startAt);
  }

  if (!experience.recurrence) return 'Sin recurrencia';

  return `${formatDayList(experience.recurrence.daysOfWeek)} - ${experience.recurrence.startTime} a ${experience.recurrence.endTime}`;
}
