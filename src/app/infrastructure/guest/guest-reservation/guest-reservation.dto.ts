import { OccupiedDateRange } from '@/domain/guest/guest-reservation/guest-reservation.model';

export interface UnitCalendarDto {
  message: string;
  data: OccupiedDateRange[];
}
