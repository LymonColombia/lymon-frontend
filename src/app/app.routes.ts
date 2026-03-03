import { Routes } from '@angular/router';
import { LoginComponent } from '@/presentation/features/auth/pages/login/login';
import { RegisterComponent } from '@/presentation/features/auth/pages/register/register';
import { RecoverPasswordComponent } from '@/presentation/features/auth/pages/recoverPassword/recoverPassword';
import { ConfirmRecoverPasswordComponent } from '@/presentation/features/auth/pages/confirmRecoverPassword/confirmRecoverPassword';
import { BookingComponent } from '@/presentation/features/hotel/pages/booking/booking';
import { CheckinComponent } from '@/presentation/features/hotel/pages/checkin/checkin';
import { CreateRoomComponent } from '@/presentation/features/hotel/pages/createRoom/createRoom';
import { RegisterEmployeeComponent } from '@/presentation/features/hotel/pages/registerEmployee/registerEmployee';
import { RoomDetailsComponent } from '@/presentation/features/hotel/pages/roomDetails/roomDetails';
import { SalesSummaryComponent } from '@/presentation/features/hotel/pages/salesSummary/salesSummary';
import { CalendarSyncComponent } from '@/presentation/features/hotel/pages/calendarSync/calendarSync';
import { EmailConfigComponent } from '@/presentation/features/hotel/pages/emailConfig/emailConfig';
import { authGuard, guestGuard } from '@/infrastructure/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'recover-password', component: RecoverPasswordComponent, canActivate: [guestGuard] },
  { path: 'recover-password/confirm', component: ConfirmRecoverPasswordComponent, canActivate: [guestGuard] },
  { path: 'booking', component: BookingComponent, canActivate: [authGuard] },
  { path: 'checkin', component: CheckinComponent, canActivate: [authGuard] },
  { path: 'create-room', component: CreateRoomComponent, canActivate: [authGuard] },
  { path: 'register-employee', component: RegisterEmployeeComponent, canActivate: [authGuard] },
  { path: 'room-details', component: RoomDetailsComponent, canActivate: [authGuard] },
  { path: 'sales-summary', component: SalesSummaryComponent, canActivate: [authGuard] },
  { path: 'calendar-sync', component: CalendarSyncComponent, canActivate: [authGuard] },
  { path: 'email-config', component: EmailConfigComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' },
];
