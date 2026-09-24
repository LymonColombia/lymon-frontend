import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestAuthRepository } from '@/domain/repositories/guest-auth.repository';
import { GuestRegisterRequest, GuestRegisterResponse } from '@/domain/entities/guest-auth.model';

@Injectable({ providedIn: 'root' })
export class GuestRegisterUseCase {
  private readonly repo = inject(GuestAuthRepository);

  execute(data: GuestRegisterRequest): Observable<GuestRegisterResponse> {
    return this.repo.register(data);
  }
}
