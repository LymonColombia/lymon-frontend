import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type AuthAccountType = 'tenant' | 'guest';
export type AuthFormMode = 'login' | 'register';

const TENANT_ROUTES: Record<AuthFormMode, string> = {
  login: '/login',
  register: '/register',
};

const GUEST_ROUTES: Record<AuthFormMode, string> = {
  login: '/guest/login',
  register: '/guest/register',
};

@Component({
  selector: 'app-auth-type-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './auth-type-toggle.component.html',
  styleUrl: './auth-type-toggle.component.css',
})
export class AuthTypeToggleComponent {
  readonly activeType = input.required<AuthAccountType>();
  readonly mode = input.required<AuthFormMode>();

  readonly tenantLink = computed(() => TENANT_ROUTES[this.mode()]);
  readonly guestLink = computed(() => GUEST_ROUTES[this.mode()]);
}
