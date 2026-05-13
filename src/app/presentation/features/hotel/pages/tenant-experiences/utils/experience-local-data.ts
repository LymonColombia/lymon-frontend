import { Experience } from '@/domain/entities/experience.model';
import { SelectOption } from '@/presentation/shared/components/select/select.component';

export const LOCAL_EXPERIENCES: Experience[] = [
  {
    id: 'exp-property-1',
    scope: 'PROPERTY',
    propertyId: '6650d0ef3f3d2d2d2d2d2d2d',
    unitIds: ['6650d0ef3f3d2d2d2d2d2d33'],
    name: 'Airport transfer',
    description: 'Private transfer from airport to property',
    category: 'TRANSPORTATION',
    priceCop: 120000,
    durationHours: 2,
    capacity: 8,
    coverImageUrl: 'https://image.com/experience-cover.jpg',
    location: {
      label: 'Main lobby pickup point',
      address: 'Cra 10 #20-30, Bogota',
      lat: 4.6097,
      lng: -74.0817,
    },
    availabilityType: 'DATE_RANGE',
    startAt: '2026-05-10T10:00:00.000Z',
    endAt: '2026-05-20T10:00:00.000Z',
    blackoutRanges: [
      {
        startAt: '2026-05-15T00:00:00.000Z',
        endAt: '2026-05-16T23:59:59.000Z',
      },
    ],
  },
  {
    id: 'exp-tenant-1',
    scope: 'TENANT',
    name: 'Daily shuttle service',
    description: 'Recurring daily transportation service',
    category: 'TRANSPORTATION',
    priceCop: 80000,
    durationHours: 1,
    capacity: 12,
    coverImageUrl: 'https://image.com/tenant-shuttle.jpg',
    location: {
      label: 'Terminal norte',
      address: 'Terminal del Norte',
      lat: 4.7044,
      lng: -74.0848,
    },
    availabilityType: 'RECURRING',
    recurrence: {
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '18:00',
    },
  },
];

export const LOCAL_PROPERTY_OPTIONS: SelectOption[] = [
  { value: '6650d0ef3f3d2d2d2d2d2d2d', label: 'Hotel Andino - Bogota' },
  { value: '6650d0ef3f3d2d2d2d2d2d44', label: 'Casa Verde - Medellin' },
];

export const LOCAL_UNIT_OPTIONS_BY_PROPERTY: Record<string, SelectOption[]> = {
  '6650d0ef3f3d2d2d2d2d2d2d': [
    { value: '6650d0ef3f3d2d2d2d2d2d33', label: 'Suite 201' },
    { value: '6650d0ef3f3d2d2d2d2d2d34', label: 'Suite 202' },
  ],
  '6650d0ef3f3d2d2d2d2d2d44': [
    { value: '6650d0ef3f3d2d2d2d2d2d55', label: 'Loft 1' },
    { value: '6650d0ef3f3d2d2d2d2d2d56', label: 'Loft 2' },
  ],
};

