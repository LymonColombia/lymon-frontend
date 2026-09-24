import { expect, Page } from '@playwright/test';
import { BrowseTheWeb } from './abilities/browse-the-web.ability';
import { GuestActor } from './actors/guest.actor';
import {
  openLyhostHome,
  openGuestArea,
  signInAsGuest,
  LoginCredentials,
} from './tasks/auth/login.task';
import {
  continueToGuestLogin,
  GuestRegistrationData,
  openGuestRegister,
  registerGuest,
} from './tasks/auth/register.task';
import { errorMessageFrom } from './questions/error-message.question';

/**
 * GuestFlow — top-level facade for unauthenticated guest scenarios.
 */
export class GuestFlow {
  private readonly actor: GuestActor;

  constructor(public readonly page: Page) {
    this.actor = GuestActor.named('Guest', BrowseTheWeb.using(page));
  }

  async openHome(): Promise<void> {
    await this.actor.attemptsTo(openLyhostHome());
  }

  async openGuestArea(): Promise<void> {
    await this.actor.attemptsTo(openGuestArea());
  }

  async openGuestRegister(): Promise<void> {
    await this.actor.attemptsTo(openGuestRegister());
  }

  async signInAsGuest(credentials: LoginCredentials): Promise<void> {
    await this.actor.attemptsTo(signInAsGuest(credentials));
  }

  async registerGuest(data: GuestRegistrationData): Promise<void> {
    await this.actor.attemptsTo(registerGuest(data));
  }

  async continueToGuestLogin(): Promise<void> {
    await this.actor.attemptsTo(continueToGuestLogin());
  }

  async expectGuestLoginError(message: string | RegExp): Promise<void> {
    await expect(await this.actor.asks(errorMessageFrom('app-guest-login'))).toContainText(message);
  }

  async expectGuestRegisterError(message: string | RegExp): Promise<void> {
    await expect(await this.actor.asks(errorMessageFrom('app-guest-register'))).toContainText(
      message,
    );
  }

  async expectRegistrationNotice(): Promise<void> {
    await expect(this.page.getByText(/Revisa tu correo/i)).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByText(/Enviamos un enlace/i)).toBeVisible();
  }

  async expectBookingRedirect(): Promise<void> {
    await expect(this.page).toHaveURL(/booking/i);
  }
}
