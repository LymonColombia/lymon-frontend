import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestAuthRepository } from '@/domain/repositories/guest-auth.repository';
import {
  GuestConfirmRecoverPasswordRequest,
  GuestConfirmRecoverPasswordResponse,
} from '@/domain/entities/guest-auth.model';

@Injectable({ providedIn: 'root' })
export class GuestConfirmRecoverPasswordUseCase {
  private readonly repo = inject(GuestAuthRepository);

  execute(
    data: GuestConfirmRecoverPasswordRequest,
  ): Observable<GuestConfirmRecoverPasswordResponse> {
    return this.repo.confirmRecoverPassword(data);
  }
}
