import { Observable } from 'rxjs';
import { CreateShiftDto, ShiftResponse } from '@/domain/entities/shift.model';

export abstract class ShiftRepository {
  abstract createShift(data: CreateShiftDto): Observable<ShiftResponse>;
}
