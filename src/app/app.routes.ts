import { Routes } from '@angular/router';
import { LoginComponent } from './presentation/pages/login/login';
import { RegisterComponent } from './presentation/pages/register/register';
import { BookingComponent } from './presentation/pages/booking/booking';
import { CheckinComponent } from './presentation/pages/checkin/checkin';
import { CreateRoomComponent } from './presentation/pages/createRoom/createRoom';
import { RegisterEmployeeComponent } from './presentation/pages/registerEmployee/registerEmployee';
import { RoomDetailsComponent } from './presentation/pages/roomDetails/roomDetails';
import { SalesSummaryComponent } from './presentation/pages/salesSummary/salesSummary';
import { CalendarSyncComponent } from './presentation/pages/calendarSync/calendarSync';
import { EmailConfigComponent } from './presentation/pages/emailConfig/emailConfig';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
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
