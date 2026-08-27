import { Routes } from '@angular/router';
import { GuestProfileComponent } from '@/presentation/tenant/features/crm/pages/guest-profile/guest-profile';
import { LoginComponent } from '@/presentation/tenant/features/auth/pages/login/login';
import { RegisterComponent } from '@/presentation/tenant/features/auth/pages/register/register';
import { GuestLoginComponent } from '@/presentation/guest/features/auth/pages/login/login';
import { GuestRegisterComponent } from '@/presentation/guest/features/auth/pages/register/register';
import { GuestVerifyEmailComponent } from '@/presentation/guest/features/auth/pages/verify-email/verify-email';
import { GuestForgotPasswordComponent } from '@/presentation/guest/features/auth/pages/forgot-password/forgot-password';
import { GuestResetPasswordComponent } from '@/presentation/guest/features/auth/pages/reset-password/reset-password';
import { RecoverPasswordComponent } from '@/presentation/tenant/features/auth/pages/recover-password/recover-password';
import { ConfirmRecoverPasswordComponent } from '@/presentation/tenant/features/auth/pages/recover-password-confirm/recover-password-confirm';
import { BookingComponent } from '@/presentation/public/features/booking/pages/booking/booking';
import { CheckinComponent } from '@/presentation/guest/features/checkin/pages/checkin/checkin';
import { PropertiesComponent } from '@/presentation/tenant/features/properties/pages/properties/properties';
import { RegisterEmployeeComponent } from '@/presentation/tenant/features/staff/pages/register-employee/register-employee';
import { StaffManagementComponent } from '@/presentation/tenant/features/staff/pages/staff-management/staff-management';
import { RoomDetailsComponent } from '@/presentation/public/features/room-details/pages/room-details/room-details';
import { CreateIncidentReportComponent } from '@/presentation/tenant/features/incidents/pages/create-incident-report/create-incident-report';
import { IncidentReportListComponent } from '@/presentation/tenant/features/incidents/pages/incident-report-list/incident-report-list';
import { EditIncidentReportComponent } from '@/presentation/tenant/features/incidents/pages/edit-incident-report/edit-incident-report';
import { TenantSettingsComponent } from '@/presentation/tenant/features/settings/pages/settings/settings';
import { AuditLogComponent } from '@/presentation/tenant/features/audit-log/pages/audit-log/audit-log';
import { PropertyUnitsComponent } from '@/presentation/tenant/features/units/pages/property-units/property-units';
import { GuestsCrmComponent } from '@/presentation/tenant/features/crm/pages/guests-crm/guests-crm';
import { PlansComponent } from '@/presentation/tenant/features/plans/pages/plans/plans';
import { DashboardComponent } from '@/presentation/tenant/features/dashboard/pages/dashboard/dashboard';
import { LyhostPageComponent } from '@/presentation/public/features/landing/pages/lyhost-page/lyhost-page';
import { StaffShiftComponent } from '@/presentation/tenant/features/shifts/pages/staff-shift/staff-shift';
import { TenantShellComponent } from '@/presentation/tenant/layout/tenant-shell/tenant-shell';
import { adminGuard } from '@/infrastructure/guards/admin.guard';
import { adminPublicGuard } from '@/infrastructure/guards/admin-public.guard';
import { guestPublicGuard } from '@/infrastructure/guards/guest-public.guard';
import { guestGuard } from '@/infrastructure/guards/guest.guard';
import { GuestCartPage } from '@/presentation/guest/features/cart/pages/cart/cart';
import { GuestReservationsComponent } from '@/presentation/guest/features/reservations/pages/reservation-list/reservation-list';
import { GuestReservationDetailsComponent } from '@/presentation/guest/features/reservations/pages/reservation-details/reservation-details';
import { InventoryComponent } from '@/presentation/tenant/features/inventory/pages/inventory/inventory';

import { PaymentSuccessComponent } from '@/presentation/guest/features/payment/pages/payment-success/payment-success';
import { PaymentFailureComponent } from '@/presentation/guest/features/payment/pages/payment-failure/payment-failure';

import { ExperienceComponent } from '@/presentation/public/features/experiences/pages/experiences/experiences';
import { ExperienceDetailPageComponent } from '@/presentation/public/features/experiences/pages/experience-detail-page/experience-detail-page';

import { TenantExperiencesPageComponent } from '@/presentation/tenant/features/experiences/pages/experience-list/experience-list';
import { TenantExperienceFormPageComponent } from '@/presentation/tenant/features/experiences/pages/experience-form-page/experience-form-page';
import { TenantExperienceDetailPageComponent } from '@/presentation/tenant/features/experiences/pages/experience-detail/experience-detail';

import { StorageTestComponent } from '@/presentation/tenant/features/storage-test/pages/storage-test/storage-test';
import { TenantReservations } from '@/presentation/tenant/features/reservations/pages/reservation-list/reservation-list'; 
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
  { path: 'experiences', component: ExperienceComponent },
  { path: 'experiences/:id', component: ExperienceDetailPageComponent },

  // Guest flow
  { path: 'guest/cart', component: GuestCartPage, canActivate: [guestGuard] },

  { path: 'guest/reservations', component: GuestReservationsComponent, canActivate: [guestGuard] },

  {
    path: 'guest/reservations/:id',
    component: GuestReservationDetailsComponent,
    canActivate: [guestGuard],
  },

  { path: 'guest/payment/success', component: PaymentSuccessComponent, canActivate: [guestGuard] },
  { path: 'guest/payment/failure', component: PaymentFailureComponent, canActivate: [guestGuard] },

  { path: 'guest/checkin', component: CheckinComponent, canActivate: [guestGuard] },

  // Authenticated hotel shell
  {
    path: '',
    component: TenantShellComponent,
    canActivate: [adminGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'checkin', component: CheckinComponent },
      { path: 'properties', component: PropertiesComponent },
      { path: 'properties/:propertyId/inventory', component: InventoryComponent },
      { path: 'register-employee', component: RegisterEmployeeComponent },
      { path: 'employee-management', component: StaffManagementComponent },
      { path: 'room-details/:unitId', component: RoomDetailsComponent },
      { path: 'room-details', component: RoomDetailsComponent },
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
      { path: 'storage-test', component: StorageTestComponent },
      { path: 'tenant-experiences', component: TenantExperiencesPageComponent },
      { path: 'tenant-experiences/new', component: TenantExperienceFormPageComponent },
      { path: 'tenant-experiences/:id', component: TenantExperienceDetailPageComponent },
      { path: 'tenant-experiences/:id/edit', component: TenantExperienceFormPageComponent },
      { path: 'storage-test', component: StorageTestComponent },
      { path: 'tenant-reservations', component: TenantReservations}
    ],
  },

  { path: '**', redirectTo: '/lyhost' },
];
