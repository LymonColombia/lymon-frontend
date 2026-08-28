import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestAuthRepository } from '@/domain/repositories/guest-auth.repository';
import {
  GuestRecoverPasswordRequest,
  GuestRecoverPasswordResponse,
} from '@/domain/entities/guest-auth.model';

@Injectable({ providedIn: 'root' })
export class GuestRecoverPasswordUseCase {
  private readonly repo = inject(GuestAuthRepository);

  execute(data: GuestRecoverPasswordRequest): Observable<GuestRecoverPasswordResponse> {
    return this.repo.recoverPassword(data);
  }
}
