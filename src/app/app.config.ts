import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideNgIconLoader, withCaching } from '@ng-icons/core';
import { AuthRepository } from '@/domain/repositories/auth.repository';
import { AuthRepositoryImpl } from '@/infrastructure/repositories/auth.repository.impl';
import { UserRepository } from '@/domain/repositories/user.repository';
import { UserRepositoryImpl } from '@/infrastructure/repositories/user.repository.impl';
import { IncidentReportRepository } from '@/domain/repositories/incident-report.repository';
import { IncidentReportRepositoryImpl } from '@/infrastructure/repositories/incident-report.repository.impl';
import { TenantRepository } from '@/domain/repositories/tenant.repository';
import { TenantRepositoryImpl } from '@/infrastructure/repositories/tenant.repository.impl';
import { authInterceptor } from '@/infrastructure/interceptors/auth.interceptor';
import { guestAuthInterceptor } from '@/infrastructure/interceptors/guest-auth.interceptor';
import { StaffRepository } from '@/domain/repositories/staff.repository';
import { StaffRepositoryImpl } from '@/infrastructure/repositories/staff.repository.impl';
import { PropertyRepository } from '@/domain/repositories/property.repository';
import { PropertyRepositoryImpl } from '@/infrastructure/repositories/property.repository.impl';
import { GuestAuthRepository } from '@/domain/repositories/guest-auth.repository';
import { GuestAuthRepositoryImpl } from '@/infrastructure/repositories/guest-auth.repository.impl';
import { AuditLogRepository } from '@/domain/repositories/audit-log.repository';
import { AuditLogRepositoryImpl } from '@/infrastructure/repositories/audit-log.repository.impl';
import { ReservationRepository } from '@/domain/repositories/reservation.repository';
import { ReservationRepositoryImpl } from '@/infrastructure/repositories/reservation.repository.impl';
import { CrmRepository } from '@/domain/repositories/crm.repository';
import { CrmRepositoryImpl } from '@/infrastructure/repositories/crm.repository.impl';
import { GuestReservationRepository } from '@/domain/repositories/guest-reservation.repository';
import { GuestReservationRepositoryImpl } from '@/infrastructure/repositories/guest-reservation.repository.impl';
import { SupplierRepository } from '@/domain/repositories/supplier.repository';
import { SupplierRepositoryImpl } from '@/infrastructure/repositories/supplier.repository.impl';
import { ExperienceRepository } from '@/domain/repositories/experience.repository';
import { ExperienceRepositoryImpl } from '@/infrastructure/repositories/experience.repository.impl';
import { ImageStorageRepository } from '@/domain/repositories/storage-img.repository';
import { ImageStorageRepositoryImpl } from '@/infrastructure/repositories/storage-img.impl';
import { ShiftRepository } from '@/domain/repositories/shift.repository';
import { ShiftRepositoryImpl } from '@/infrastructure/repositories/shift.repository.impl';
import { InventoryRepository } from '@/domain/repositories/inventory.repository';
import { InventoryRepositoryImpl } from '@/infrastructure/repositories/inventory.repository.impl';
import { StorageRepository } from '@/domain/repositories/storage.repository';
import { StorageRepositoryImpl } from '@/infrastructure/repositories/storage.repository.impl';
import { TenantGuestRepository } from '@/domain/repositories/tenant-guest.repository';
import { TenantGuestRepositoryImpl } from '@/infrastructure/repositories/tenant-guest.repository.impl';
import { GuestCartRepository } from '@/domain/repositories/guest-cart.repository';
import { GuestCartRepositoryImpl } from '@/infrastructure/repositories/guest-cart.repository.impl';
import { GuestExperienceRepository } from '@/domain/repositories/guest-experience.repository';
import { GuestExperienceRepositoryImpl } from '@/infrastructure/repositories/guest-experience.repository.impl';
import { PaymentRepository } from '@/domain/repositories/payment.repository';
import { PaymentRepositoryImpl } from '@/infrastructure/repositories/payment.repository.impl';
import { PlanRepository } from '@/domain/repositories/plan.repository';
import { PlanRepositoryImpl } from '@/infrastructure/repositories/plan.repository.impl';
import { routes } from './app.routes';

const ICON_LOADER_BASE_PATH = '/extra-icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([guestAuthInterceptor, authInterceptor])),
    provideNgIconLoader(
      (name) =>
        inject(HttpClient).get(`${ICON_LOADER_BASE_PATH}/${name}.svg`, {
          responseType: 'text',
        }),
      withCaching()
    ),
    { provide: AuthRepository, useClass: AuthRepositoryImpl },
    { provide: UserRepository, useClass: UserRepositoryImpl },
    { provide: IncidentReportRepository, useClass: IncidentReportRepositoryImpl },
    { provide: TenantRepository, useClass: TenantRepositoryImpl },
    { provide: StaffRepository, useClass: StaffRepositoryImpl },
    { provide: PropertyRepository, useClass: PropertyRepositoryImpl },
    { provide: GuestAuthRepository, useClass: GuestAuthRepositoryImpl },
    { provide: AuditLogRepository, useClass: AuditLogRepositoryImpl },
    { provide: ReservationRepository, useClass: ReservationRepositoryImpl },
    { provide: CrmRepository, useClass: CrmRepositoryImpl },
    { provide: GuestReservationRepository, useClass: GuestReservationRepositoryImpl },
    { provide: SupplierRepository, useClass: SupplierRepositoryImpl },
    { provide: ExperienceRepository, useClass: ExperienceRepositoryImpl },
    { provide: ImageStorageRepository, useClass: ImageStorageRepositoryImpl },
    { provide: ShiftRepository, useClass: ShiftRepositoryImpl },
    { provide: InventoryRepository, useClass: InventoryRepositoryImpl },
    { provide: StorageRepository, useClass: StorageRepositoryImpl },
    { provide: TenantGuestRepository, useClass: TenantGuestRepositoryImpl },
    { provide: GuestCartRepository, useClass: GuestCartRepositoryImpl },
    { provide: GuestExperienceRepository, useClass: GuestExperienceRepositoryImpl },
    { provide: PaymentRepository, useClass: PaymentRepositoryImpl },
    { provide: PlanRepository, useClass: PlanRepositoryImpl },
  ],
};
