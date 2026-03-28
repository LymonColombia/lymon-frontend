import { Routes } from '@angular/router';
import { LoginComponent } from '@/presentation/features/auth/pages/login/login';
import { RegisterComponent } from '@/presentation/features/auth/pages/register/register';
import { GuestLoginComponent } from '@/presentation/features/guest-auth/pages/login/guest-login';
import { GuestRegisterComponent } from '@/presentation/features/guest-auth/pages/register/guest-register';
import { GuestVerifyEmailComponent } from '@/presentation/features/guest-auth/pages/verify-email/verify-email';
import { GuestForgotPasswordComponent } from '@/presentation/features/guest-auth/pages/forgot-password/forgot-password';
import { GuestResetPasswordComponent } from '@/presentation/features/guest-auth/pages/reset-password/reset-password';
import { RecoverPasswordComponent } from '@/presentation/features/auth/pages/recoverPassword/recoverPassword';
import { ConfirmRecoverPasswordComponent } from '@/presentation/features/auth/pages/confirmRecoverPassword/confirmRecoverPassword';
import { BookingComponent } from '@/presentation/features/hotel/pages/booking/booking';
import { CheckinComponent } from '@/presentation/features/hotel/pages/checkin/checkin';
import { PropertiesComponent } from '@/presentation/features/hotel/pages/properties/properties';
import { RegisterEmployeeComponent } from '@/presentation/features/hotel/pages/registerEmployee/registerEmployee';
import { RoomDetailsComponent } from '@/presentation/features/hotel/pages/roomDetails/roomDetails';
import { SalesSummaryComponent } from '@/presentation/features/hotel/pages/salesSummary/salesSummary';
import { CalendarSyncComponent } from '@/presentation/features/hotel/pages/calendarSync/calendarSync';
import { EmailConfigComponent } from '@/presentation/features/hotel/pages/emailConfig/emailConfig';
import { CreateIncidentReportComponent } from '@/presentation/features/hotel/pages/incidentReport/create/createIncidentReport';
import { IncidentReportListComponent } from '@/presentation/features/hotel/pages/incidentReport/list/incidentReportList';
import { EditIncidentReportComponent } from '@/presentation/features/hotel/pages/incidentReport/edit/editIncidentReport';
import { TenantSettingsComponent } from '@/presentation/features/hotel/pages/tenantSettings/tenantSettings';
import { AuditLogComponent } from '@/presentation/features/hotel/pages/auditLog/auditLog';
import { PropertyUnitsComponent } from '@/presentation/features/hotel/pages/propertyUnits/propertyUnits';
import { GuestsCrmComponent } from '@/presentation/features/hotel/pages/guestsCrm/guestsCrm';
import { PlansComponent } from '@/presentation/features/hotel/pages/plans/plans';
import { DashboardComponent } from '@/presentation/features/dashboard/dashboard';
import { HotelShellComponent } from '@/presentation/features/hotel/components/hotel-shell/hotel-shell';
import { LyhostPageComponent } from '@/presentation/features/landing/pages/lyhost/lyhost-page.component';
import { authGuard, guestGuard } from '@/infrastructure/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'lyhost', component: LyhostPageComponent },

  // Auth routes — only accessible when NOT authenticated
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'recover-password', component: RecoverPasswordComponent, canActivate: [guestGuard] },
  {
    path: 'recover-password/confirm',
    component: ConfirmRecoverPasswordComponent,
    canActivate: [guestGuard],
  },
  
  // Guest auth routes — separate flow for hotel guests
  { path: 'guest/login', component: GuestLoginComponent },
  { path: 'guest/register', component: GuestRegisterComponent },
  { path: 'guest/verify-email', component: GuestVerifyEmailComponent },
  { path: 'guest/forgot-password', component: GuestForgotPasswordComponent },
  { path: 'guest/reset-password', component: GuestResetPasswordComponent },

  // Booking — authenticated but no sidebar (Provitional route, will be changed on other branch)
  { path: 'booking', component: BookingComponent, canActivate: [authGuard] },

  // Authenticated hotel shell
  {
    path: '',
    component: HotelShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'checkin', component: CheckinComponent },
      { path: 'properties', component: PropertiesComponent },
      { path: 'register-employee', component: RegisterEmployeeComponent },
      { path: 'room-details/:unitId', component: RoomDetailsComponent },
      { path: 'room-details', component: RoomDetailsComponent },
      { path: 'sales-summary', component: SalesSummaryComponent },
      { path: 'calendar-sync', component: CalendarSyncComponent },
      { path: 'email-config', component: EmailConfigComponent },
      { path: 'plans', component: PlansComponent },
      { path: 'settings', component: TenantSettingsComponent },
      { path: 'change-password', redirectTo: 'settings', pathMatch: 'full' },
      { path: 'incident-report/create', component: CreateIncidentReportComponent },
      { path: 'incident-report/list', component: IncidentReportListComponent },
      { path: 'incident-report/edit/:id', component: EditIncidentReportComponent },
      { path: 'tenant-profile', redirectTo: 'settings', pathMatch: 'full' },
      { path: 'audit-log', component: AuditLogComponent },
      { path: 'property-units', component: PropertyUnitsComponent },
      { path: 'crm/guests', component: GuestsCrmComponent },
    ],
  },

  { path: '**', redirectTo: '/login' },
];
