import { Observable } from 'rxjs';
import { CreateShiftDto, ShiftResponse, UpdateShiftDto } from '@/domain/entities/shift.model';

export abstract class ShiftRepository {
  abstract createShift(data: CreateShiftDto): Observable<ShiftResponse>;
  abstract getShifts(propertyId?: string, startDate?: string, endDate?: string): Observable<ShiftResponse[]>;
  abstract updateShift(id: string, data: UpdateShiftDto): Observable<ShiftResponse>;
  abstract deleteShift(id: string): Observable<void>;
}
