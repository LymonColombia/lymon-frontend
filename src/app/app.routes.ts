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

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'booking', component: BookingComponent },
  { path: 'checkin', component: CheckinComponent },
  { path: 'create-room', component: CreateRoomComponent },
  { path: 'register-employee', component: RegisterEmployeeComponent },
  { path: 'room-details', component: RoomDetailsComponent },
  { path: 'sales-summary', component: SalesSummaryComponent },
  { path: 'calendar-sync', component: CalendarSyncComponent },
  { path: '**', redirectTo: '/login' }
];
