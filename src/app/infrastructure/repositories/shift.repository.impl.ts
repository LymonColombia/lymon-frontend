import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShiftRepository } from '@/domain/repositories/shift.repository';
import { CreateShiftDto, ShiftResponse } from '@/domain/entities/shift.model';
import { environment } from '@env';

@Injectable({ providedIn: 'root' })
export class ShiftRepositoryImpl extends ShiftRepository {
  private readonly http = inject(HttpClient);

  createShift(data: CreateShiftDto): Observable<ShiftResponse> {
    return this.http.post<ShiftResponse>(
      `${environment.apiUrl}${environment.shifts.endpoint}`,
      data,

    );
  }
}

