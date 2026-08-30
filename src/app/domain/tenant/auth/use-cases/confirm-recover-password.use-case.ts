import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '@/domain/tenant/auth/auth.repository';
import {
  ConfirmRecoverPasswordRequest,
  ConfirmRecoverPasswordResponse,
} from '@/domain/tenant/auth/auth.model';

@Injectable({ providedIn: 'root' })
export class ConfirmRecoverPasswordUseCase {
  private readonly authRepository = inject(AuthRepository);

  execute(data: ConfirmRecoverPasswordRequest): Observable<ConfirmRecoverPasswordResponse> {
    return this.authRepository.confirmRecoverPassword(data);
  }
}
