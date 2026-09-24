import { OccupiedDateRange } from '@/domain/entities/guest-reservation.model';

export interface UnitCalendarDto {
  message: string;
  data: OccupiedDateRange[];
}
