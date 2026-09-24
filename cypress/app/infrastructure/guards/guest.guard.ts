import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';

export const guestGuard: CanActivateFn = () => {
  const guestTokenService = inject(GuestTokenService);
  const router = inject(Router);
  if (guestTokenService.isAuthenticated()) return true;
  return router.createUrlTree(['/guest/login']);
};
