import { Routes } from '@angular/router';
import { publicRoutes } from '@/presentation/public/public.routes';
import { guestRoutes } from '@/presentation/guest/guest.routes';
import { tenantRoutes } from '@/presentation/tenant/tenant.routes';
import { lyhostLandingPath } from '@/presentation/public/features/landing/pages/lyhost-page/i18n/lyhost-i18n';

export const routes: Routes = [
  { path: '', redirectTo: lyhostLandingPath, pathMatch: 'full' },
  ...publicRoutes,
  ...guestRoutes,
  ...tenantRoutes,
  { path: '**', redirectTo: lyhostLandingPath },
];
