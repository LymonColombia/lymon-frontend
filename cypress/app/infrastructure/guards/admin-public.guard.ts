import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '@/infrastructure/services/token.service';

export const adminPublicGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  if (!tokenService.isAuthenticated()) return true;
  return router.createUrlTree(['/dashboard']);
};
