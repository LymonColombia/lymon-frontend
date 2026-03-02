import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthRepository } from '@/domain/repositories/auth.repository';
import { AuthRepositoryImpl } from '@/infrastructure/repositories/auth.repository.impl';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: AuthRepository, useClass: AuthRepositoryImpl },
  ],
};
