import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
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
import { ShiftRepository } from '@/domain/repositories/shift.repository';
import { ShiftRepositoryImpl } from '@/infrastructure/repositories/shift.repository.impl';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([guestAuthInterceptor, authInterceptor])),
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
    { provide: ShiftRepository, useClass: ShiftRepositoryImpl },
  ],
};
