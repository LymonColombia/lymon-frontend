import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '@/domain/repositories/auth.repository';
import {
  ConfirmRecoverPasswordRequest,
  ConfirmRecoverPasswordResponse,
} from '@/domain/entities/auth.model';

@Injectable({ providedIn: 'root' })
export class ConfirmRecoverPasswordUseCase {
  private readonly authRepository = inject(AuthRepository);

  execute(data: ConfirmRecoverPasswordRequest): Observable<ConfirmRecoverPasswordResponse> {
    return this.authRepository.confirmRecoverPassword(data);
  }
}
