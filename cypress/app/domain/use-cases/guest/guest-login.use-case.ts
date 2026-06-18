import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { GuestAuthRepository } from '@/domain/repositories/guest-auth.repository';
import { GuestLoginRequest, GuestLoginResponse } from '@/domain/entities/guest-auth.model';
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';

@Injectable({ providedIn: 'root' })
export class GuestLoginUseCase {
  private readonly repo = inject(GuestAuthRepository);
  private readonly tokenService = inject(GuestTokenService);

  execute(credentials: GuestLoginRequest): Observable<GuestLoginResponse> {
    return this.repo.login(credentials).pipe(
      tap((res) =>
        this.tokenService.store({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          emailVerified: res.emailVerified,
        }),
      ),
    );
  }
}
