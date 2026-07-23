import { FormControl, FormGroup } from '@angular/forms';
import { MediaItem } from '@/domain/entities/storage.model';
import { CreateExperienceDto, Experience, ExperienceScope } from '@/domain/entities/experience.model';

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

export interface RecurrenceFormControls {
  daysOfWeek: FormControl<number[]|undefined>;
  startTime: FormControl<string|undefined>;
  endTime: FormControl<string|undefined>;
}

export interface ExperienceFormControls {
  scope: FormControl<ExperienceScope>;
  propertyId: FormControl<string>;
  name: FormControl<string>;
  description: FormControl<string>;
  city: FormControl<string>;
  priceCop: FormControl<number>;
  capacity: FormControl<number>;
  minimumParticipants: FormControl<number>;
  recurrence: FormGroup<RecurrenceFormControls>;
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

export const EXPERIENCE_SCOPE_OPTIONS: ReadonlyArray<{ value: ExperienceScope; label: string }> = [
  { value: 'PROPERTY', label: 'Propiedad' },
  { value: 'GLOBAL', label: 'Global' },
];

export function normalizeExperienceScope(scope: string | null | undefined): ExperienceScope {
  const normalized = scope?.trim().toUpperCase();
  return normalized === 'PROPERTY' ? 'PROPERTY' : 'GLOBAL';
}

export function getExperienceScopeLabel(scope: string | null | undefined): string {
  return normalizeExperienceScope(scope) === 'PROPERTY' ? 'Propiedad' : 'Global';
}

export function isPropertyScope(scope: string | null | undefined): boolean {
  return normalizeExperienceScope(scope) === 'PROPERTY';
}

export function formatDayList(daysOfWeek: number[] | undefined): string {
  if (!daysOfWeek || daysOfWeek.length === 0) {
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

export function getAvailabilitySummary(experience: Experience): string {
  if (experience.availabilityType === 'RECURRING' && experience.recurrence) {
    return `${formatDayList(experience.recurrence.daysOfWeek)} - ${experience.recurrence.startTime} a ${experience.recurrence.endTime}`;
  }
  return 'Disponible en cualquier momento';
}
