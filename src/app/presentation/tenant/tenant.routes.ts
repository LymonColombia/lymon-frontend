import { Routes } from '@angular/router';
import { adminGuard } from '@/infrastructure/guards/admin.guard';
import { adminPublicGuard } from '@/infrastructure/guards/admin-public.guard';
import { TenantShellComponent } from '@/presentation/tenant/layout/tenant-shell/tenant-shell';
import { LoginComponent } from '@/presentation/tenant/features/auth/pages/login/login';
import { RegisterComponent } from '@/presentation/tenant/features/auth/pages/register/register';
import { RecoverPasswordComponent } from '@/presentation/tenant/features/auth/pages/recover-password/recover-password';
import { ConfirmRecoverPasswordComponent } from '@/presentation/tenant/features/auth/pages/recover-password-confirm/recover-password-confirm';
import { DashboardComponent } from '@/presentation/tenant/features/dashboard/pages/dashboard/dashboard';
import { PropertiesComponent } from '@/presentation/tenant/features/properties/pages/properties/properties';
import { InventoryComponent } from '@/presentation/tenant/features/inventory/pages/inventory/inventory';
import { PropertyUnitsComponent } from '@/presentation/tenant/features/units/pages/property-units/property-units';
import { RegisterEmployeeComponent } from '@/presentation/tenant/features/staff/pages/register-employee/register-employee';
import { StaffManagementComponent } from '@/presentation/tenant/features/staff/pages/staff-management/staff-management';
import { StaffShiftComponent } from '@/presentation/tenant/features/shifts/pages/staff-shift/staff-shift';
import { GuestsCrmComponent } from '@/presentation/tenant/features/crm/pages/guests-crm/guests-crm';
import { GuestProfileComponent } from '@/presentation/tenant/features/crm/pages/guest-profile/guest-profile';
import { CreateIncidentReportComponent } from '@/presentation/tenant/features/incidents/pages/create-incident-report/create-incident-report';
import { EditIncidentReportComponent } from '@/presentation/tenant/features/incidents/pages/edit-incident-report/edit-incident-report';
import { IncidentReportListComponent } from '@/presentation/tenant/features/incidents/pages/incident-report-list/incident-report-list';
import { TenantExperiencesPageComponent } from '@/presentation/tenant/features/experiences/pages/experience-list/experience-list';
import { TenantExperienceFormPageComponent } from '@/presentation/tenant/features/experiences/pages/experience-form-page/experience-form-page';
import { TenantExperienceDetailPageComponent } from '@/presentation/tenant/features/experiences/pages/experience-detail/experience-detail';
import { TenantReservations } from '@/presentation/tenant/features/reservations/pages/reservation-list/reservation-list';
import { TenantSettingsComponent } from '@/presentation/tenant/features/settings/pages/settings/settings';
import { PlansComponent } from '@/presentation/tenant/features/plans/pages/plans/plans';
import { AuditLogComponent } from '@/presentation/tenant/features/audit-log/pages/audit-log/audit-log';
import { StorageTestComponent } from '@/presentation/tenant/features/storage-test/pages/storage-test/storage-test';
// The admin shell also exposes two views owned by other audiences.
import { CheckinComponent } from '@/presentation/guest/features/checkin/pages/checkin/checkin';
import { RoomDetailsComponent } from '@/presentation/public/features/room-details/pages/room-details/room-details';

/** Admin back office. Auth pages are blocked once signed in; everything else hangs off the shell. */
export const tenantRoutes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [adminPublicGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [adminPublicGuard] },
  { path: 'recover-password', component: RecoverPasswordComponent, canActivate: [adminPublicGuard] },
  {
    path: 'recover-password/confirm',
    component: ConfirmRecoverPasswordComponent,
    canActivate: [adminPublicGuard],
  },

  {
    path: '',
    component: TenantShellComponent,
    canActivate: [adminGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'properties', component: PropertiesComponent },
      { path: 'properties/:propertyId/inventory', component: InventoryComponent },
      { path: 'property-units', component: PropertyUnitsComponent },
      { path: 'register-employee', component: RegisterEmployeeComponent },
      { path: 'employee-management', component: StaffManagementComponent },
      { path: 'staff-shift', component: StaffShiftComponent },
      { path: 'crm/guests', component: GuestsCrmComponent },
      { path: 'crm/guests/:guestId', component: GuestProfileComponent },
      { path: 'incident-report/create', component: CreateIncidentReportComponent },
      { path: 'incident-report/list', component: IncidentReportListComponent },
      { path: 'incident-report/edit/:id', component: EditIncidentReportComponent },
      { path: 'tenant-experiences', component: TenantExperiencesPageComponent },
      { path: 'tenant-experiences/new', component: TenantExperienceFormPageComponent },
      { path: 'tenant-experiences/:id', component: TenantExperienceDetailPageComponent },
      { path: 'tenant-experiences/:id/edit', component: TenantExperienceFormPageComponent },
      { path: 'tenant-reservations', component: TenantReservations },
      { path: 'settings', component: TenantSettingsComponent },
      { path: 'plans', component: PlansComponent },
      { path: 'audit-log', component: AuditLogComponent },
      { path: 'checkin', component: CheckinComponent },
      { path: 'room-details', component: RoomDetailsComponent },
      { path: 'room-details/:unitId', component: RoomDetailsComponent },
      { path: 'storage-test', component: StorageTestComponent },
      { path: 'storage-test', component: StorageTestComponent },
      { path: 'change-password', redirectTo: 'settings', pathMatch: 'full' },
      { path: 'tenant-profile', redirectTo: 'settings', pathMatch: 'full' },
    ],
  },
];
