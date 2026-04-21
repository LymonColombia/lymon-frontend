import { Routes } from '@angular/router';
import { GuestProfileComponent } from '@/presentation/features/hotel/pages/guestProfile/guestProfile';
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
import { StaffManagementComponent } from '@/presentation/features/hotel/pages/staffManagement/staffManagement';
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
import { LyhostPageComponent } from '@/presentation/features/landing/pages/lyhost/lyhost-page.component';
import { StaffShiftComponent } from '@/presentation/features/hotel/pages/staffShift/staffShift';
import { HotelShellComponent } from '@/presentation/features/hotel/components/hotel-shell/hotel-shell';
import { adminGuard } from '@/infrastructure/guards/admin.guard';
import { adminPublicGuard } from '@/infrastructure/guards/admin-public.guard';
import { guestPublicGuard } from '@/infrastructure/guards/guest-public.guard';
import { guestGuard } from '@/infrastructure/guards/guest.guard';
import { GuestCheckoutComponent } from '@/presentation/features/hotel/pages/guest-checkout/guest-checkout';
import { GuestReservationsComponent } from '@/presentation/features/hotel/pages/guest-reservations/guest-reservations';
import { GuestReservationDetailsComponent } from '@/presentation/features/hotel/pages/guest-reservation-details/guest-reservation-details';
import { InventoryComponent } from '@/presentation/features/hotel/pages/inventory/inventory';
import { SessionsComponent } from '@/presentation/features/hotel/pages/sessions/sessions';

export const routes: Routes = [
  { path: '', redirectTo: '/lyhost', pathMatch: 'full' },
  { path: 'lyhost', component: LyhostPageComponent },
  { path: 'room-details', component: RoomDetailsComponent },
  { path: 'room-details/:unitId', component: RoomDetailsComponent },

  // Auth routes — only accessible when NOT authenticated as admin
  { path: 'login', component: LoginComponent, canActivate: [adminPublicGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [adminPublicGuard] },
  { path: 'recover-password', component: RecoverPasswordComponent, canActivate: [adminPublicGuard] },
  {
    path: 'recover-password/confirm',
    component: ConfirmRecoverPasswordComponent,
    canActivate: [adminPublicGuard],
  },

  // Guest auth routes — only accessible when NOT authenticated as guest
  { path: 'guest/login', component: GuestLoginComponent, canActivate: [guestPublicGuard] },
  { path: 'guest/register', component: GuestRegisterComponent, canActivate: [guestPublicGuard] },
  { path: 'guest/verify-email', component: GuestVerifyEmailComponent, canActivate: [guestPublicGuard] },
  { path: 'guest/forgot-password', component: GuestForgotPasswordComponent, canActivate: [guestPublicGuard] },
  { path: 'guest/reset-password', component: GuestResetPasswordComponent, canActivate: [guestPublicGuard] },

  // Booking — public route (no auth required)
  { path: 'booking', component: BookingComponent },

  // Guest flow
  { path: 'guest/checkout', component: GuestCheckoutComponent, canActivate: [guestGuard] },

  { path: 'guest/reservations', component: GuestReservationsComponent, canActivate: [guestGuard] },

  {
    path: 'guest/reservations/:id',
    component: GuestReservationDetailsComponent,
    canActivate: [guestGuard],
  },

  { path: 'guest/checkin', component: CheckinComponent, canActivate: [guestGuard] },

  // Authenticated hotel shell
  {
    path: '',
    component: HotelShellComponent,
    canActivate: [adminGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'checkin', component: CheckinComponent },
      { path: 'properties', component: PropertiesComponent },
      { path: 'register-employee', component: RegisterEmployeeComponent },
      { path: 'employee-management', component: StaffManagementComponent },
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
      { path: 'crm/guests/:guestId', component: GuestProfileComponent },
      { path: 'staff-shift', component: StaffShiftComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: 'sessions', component: SessionsComponent },
    ],
  },

  { path: '**', redirectTo: '/lyhost' },
];
