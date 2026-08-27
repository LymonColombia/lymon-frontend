import { Routes } from '@angular/router';
import { publicRoutes } from '@/presentation/public/public.routes';
import { guestRoutes } from '@/presentation/guest/guest.routes';
import { tenantRoutes } from '@/presentation/tenant/tenant.routes';

const LANDING_PATH = '/lyhost';

export const routes: Routes = [
  { path: '', redirectTo: LANDING_PATH, pathMatch: 'full' },
  ...publicRoutes,
  ...guestRoutes,
  // Must come last: it owns the empty path for the authenticated shell.
  ...tenantRoutes,
  { path: '**', redirectTo: LANDING_PATH },
];
