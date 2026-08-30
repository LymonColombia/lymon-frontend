import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '@/domain/tenant/auth/auth.repository';
import { RecoverPasswordRequest, RecoverPasswordResponse } from '@/domain/tenant/auth/auth.model';

@Injectable({ providedIn: 'root' })
export class RecoverPasswordUseCase {
  private readonly authRepository = inject(AuthRepository);

  execute(data: RecoverPasswordRequest): Observable<RecoverPasswordResponse> {
    return this.authRepository.recoverPassword(data);
  }
}
