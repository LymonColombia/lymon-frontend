import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ShiftRepository } from '@/domain/repositories/shift.repository';
import { CreateShiftDto, ShiftResponse, UpdateShiftDto } from '@/domain/entities/shift.model';
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

  getShifts(propertyId?: string, startDate?: string, endDate?: string): Observable<ShiftResponse[]> {
    let params = new HttpParams();
    if (propertyId) {
      params = params.set('propertyId', propertyId);
    }
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http
      .get<{ data: { items: ShiftResponse[] } }>(
        `${environment.apiUrl}${environment.shifts.endpoint}`,
        { params }
      )
      .pipe(map((res) => res.data.items));
  }
  updateShift(id: string, data: UpdateShiftDto): Observable<ShiftResponse> {
    return this.http.patch<ShiftResponse>(
      `${environment.apiUrl}${environment.shifts.endpoint}/${id}`,
      data
    );
  }

  deleteShift(id: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}${environment.shifts.endpoint}/${id}`
    );
  }
}

