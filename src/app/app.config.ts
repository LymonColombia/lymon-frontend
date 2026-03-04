import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthRepository } from '@/domain/repositories/auth.repository';
import { AuthRepositoryImpl } from '@/infrastructure/repositories/auth.repository.impl';
import { UserRepository } from '@/domain/repositories/user.repository';
import { UserRepositoryImpl } from '@/infrastructure/repositories/user.repository.impl';
import { IncidentReportRepository } from '@/domain/repositories/incident-report.repository';
import { IncidentReportRepositoryImpl } from '@/infrastructure/repositories/incident-report.repository.impl';
import { authInterceptor } from '@/infrastructure/interceptors/auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: AuthRepository, useClass: AuthRepositoryImpl },
    { provide: UserRepository, useClass: UserRepositoryImpl },
    { provide: IncidentReportRepository, useClass: IncidentReportRepositoryImpl },
  ],
};
