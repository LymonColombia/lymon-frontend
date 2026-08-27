import { Routes } from '@angular/router';
import { guestGuard } from '@/infrastructure/guards/guest.guard';
import { guestPublicGuard } from '@/infrastructure/guards/guest-public.guard';
import { GuestLoginComponent } from '@/presentation/guest/features/auth/pages/login/login';
import { GuestRegisterComponent } from '@/presentation/guest/features/auth/pages/register/register';
import { GuestVerifyEmailComponent } from '@/presentation/guest/features/auth/pages/verify-email/verify-email';
import { GuestForgotPasswordComponent } from '@/presentation/guest/features/auth/pages/forgot-password/forgot-password';
import { GuestResetPasswordComponent } from '@/presentation/guest/features/auth/pages/reset-password/reset-password';
import { GuestCartPage } from '@/presentation/guest/features/cart/pages/cart/cart';
import { GuestReservationsComponent } from '@/presentation/guest/features/reservations/pages/reservation-list/reservation-list';
import { GuestReservationDetailsComponent } from '@/presentation/guest/features/reservations/pages/reservation-details/reservation-details';
import { CheckinComponent } from '@/presentation/guest/features/checkin/pages/checkin/checkin';
import { PaymentSuccessComponent } from '@/presentation/guest/features/payment/pages/payment-success/payment-success';
import { PaymentFailureComponent } from '@/presentation/guest/features/payment/pages/payment-failure/payment-failure';

/** Guest journey. Auth pages are blocked once signed in; the rest require a guest session. */
export const guestRoutes: Routes = [
  { path: 'guest/login', component: GuestLoginComponent, canActivate: [guestPublicGuard] },
  { path: 'guest/register', component: GuestRegisterComponent, canActivate: [guestPublicGuard] },
  { path: 'guest/verify-email', component: GuestVerifyEmailComponent, canActivate: [guestPublicGuard] },
  { path: 'guest/forgot-password', component: GuestForgotPasswordComponent, canActivate: [guestPublicGuard] },
  { path: 'guest/reset-password', component: GuestResetPasswordComponent, canActivate: [guestPublicGuard] },

  { path: 'guest/cart', component: GuestCartPage, canActivate: [guestGuard] },
  { path: 'guest/reservations', component: GuestReservationsComponent, canActivate: [guestGuard] },
  { path: 'guest/reservations/:id', component: GuestReservationDetailsComponent, canActivate: [guestGuard] },
  { path: 'guest/checkin', component: CheckinComponent, canActivate: [guestGuard] },
  { path: 'guest/payment/success', component: PaymentSuccessComponent, canActivate: [guestGuard] },
  { path: 'guest/payment/failure', component: PaymentFailureComponent, canActivate: [guestGuard] },
];
