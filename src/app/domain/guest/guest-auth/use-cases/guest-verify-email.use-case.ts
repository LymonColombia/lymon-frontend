import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestAuthRepository } from '@/domain/guest/guest-auth/guest-auth.repository';
import { GuestVerifyEmailResponse } from '@/domain/guest/guest-auth/guest-auth.model';

@Injectable({ providedIn: 'root' })
export class GuestVerifyEmailUseCase {
  private readonly repo = inject(GuestAuthRepository);

  execute(token: string): Observable<GuestVerifyEmailResponse> {
    return this.repo.verifyEmail(token);
  }
}
