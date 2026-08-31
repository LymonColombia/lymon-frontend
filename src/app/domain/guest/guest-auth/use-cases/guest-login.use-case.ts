import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { GuestAuthRepository } from '@/domain/guest/guest-auth/guest-auth.repository';
import { GuestSessionRepository } from '@/domain/guest/guest-session/guest-session.repository';
import { GuestLoginRequest, GuestLoginResponse } from '@/domain/guest/guest-auth/guest-auth.model';

@Injectable({ providedIn: 'root' })
export class GuestLoginUseCase {
  private readonly repo = inject(GuestAuthRepository);
  private readonly session = inject(GuestSessionRepository);

  execute(credentials: GuestLoginRequest): Observable<GuestLoginResponse> {
    return this.repo.login(credentials).pipe(
      tap((res) =>
        this.session.storeTokens({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          emailVerified: res.emailVerified,
        }),
      ),
    );
  }
}
