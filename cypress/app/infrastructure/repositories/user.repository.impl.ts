import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { UserRepository } from '@/domain/repositories/user.repository';
import { ChangePasswordRequest, ChangePasswordResponse } from '@/domain/entities/user.model';
import { environment } from '@env';

const BASE_URL = `${environment.apiUrl}${environment.user.endpoint}`;

@Injectable({ providedIn: 'root' })
export class UserRepositoryImpl extends UserRepository {
  private readonly http = inject(HttpClient);

  changePassword(data: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http
      .patch<{ message: string }>(`${BASE_URL}/change-password`, data)
      .pipe(map((res) => ({ message: res.message })));
  }
}
