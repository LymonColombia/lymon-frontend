import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthRepository } from '@/domain/repositories/auth.repository';
import { RegisterRequest, RegisterResponse } from '@/domain/entities/auth.model';
import { TokenService } from '@/infrastructure/services/token.service';

@Injectable({ providedIn: 'root' })
export class RegisterUseCase {
  private readonly authRepository = inject(AuthRepository);
  private readonly tokenService = inject(TokenService);

  execute(data: RegisterRequest): Observable<RegisterResponse> {
    return this.authRepository
      .register(data)
      .pipe(tap((response) => this.tokenService.store(response.tokens)));
  }
}
