import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepository } from '@/domain/repositories/user.repository';
import { ChangePasswordRequest, ChangePasswordResponse } from '@/domain/entities/user.model';

@Injectable({ providedIn: 'root' })
export class ChangePasswordUseCase {
  private readonly userRepository = inject(UserRepository);

  execute(data: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.userRepository.changePassword(data);
  }
}
