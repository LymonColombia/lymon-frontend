import { expect, Page } from '@playwright/test';
import { BrowseTheWeb } from './abilities/browse-the-web.ability';
import { GuestActor } from './actors/guest.actor';
import {
  openGuestArea,
  openLyhostHome,
  openManagerLogin,
  signInAsGuest,
  signInAsManager,
  LoginCredentials,
} from './tasks/auth/login.task';
import {
  continueToGuestLogin,
  GuestRegistrationData,
  openGuestRegister,
  registerGuest,
} from './tasks/auth/register.task';
import {
  createUnit,
  openPropertyUnits,
  deleteUnitByName,
  CreateUnitData,
} from './tasks/properties/create-unit.task';
import {
  openPropertiesPage,
  openCreatePropertyForm,
  fillPropertyForm,
  submitPropertyForm,
  deletePropertyByName,
  CreatePropertyData,
} from './tasks/properties/create-property.task';
import {
  openIncidentReportPage,
  openCreateIncidentReportForm,
  fillIncidentReportForm,
  submitIncidentReportForm,
  deleteIncidentReportByTitle,
  CreateIncidentReportData,
} from './tasks/incident-report/create-incident-report.task';
import { openAuditLogPage } from './tasks/audit/audit-log.task';
import { errorMessageFrom } from './questions/error-message.question';

const DASHBOARD_ARIA_SNAPSHOT = `
  - heading "Dashboard" [level=1]
  - paragraph: Resumen general de tu hotel
  - article: Habitaciones Ocupadas 0 Activas del tenant
  - article: Huéspedes Activos 0 En propiedad
  - article: Ingresos del Mes $0.00 Este mes
  - article: Tasa de Ocupación 0% Estimado (Base 120)
  - article:
    - heading "Reservaciones Finalizadas" [level=3]
    - text: nov dic ene feb mar abr
  - article:
    - heading "Ingresos Mensuales ($)" [level=3]
    - text: Estable
    - strong: $0
    - img "Comparativa de ingresos de los ultimos 6 meses":
      - text: nov
      - strong: $0
      - text: dic
      - strong: $0
      - text: ene
      - strong: $0
      - text: feb
      - strong: $0
      - text: mar
      - strong: $0
      - text: abr
      - strong: $0
  - article:
    - heading "Reservaciones Recientes" [level=3]
    - table:
      - rowgroup:
        - row "Huésped Habitación Check-in Estado":
          - columnheader "Huésped"
          - columnheader "Habitación"
          - columnheader "Check-in"
          - columnheader "Estado"
      - rowgroup:
        - row "No hay reservaciones recientes.":
          - cell "No hay reservaciones recientes."
`;

/**
 * LyhostFlow — top-level facade over the Screenplay layer.
 *
 * Provides a clean, intention-revealing API for spec files, keeping
 * Playwright selectors away from test code.
 */
export class LyhostFlow {
  private readonly actor: GuestActor;

  constructor(public readonly page: Page) {
    this.actor = GuestActor.named('Manager', BrowseTheWeb.using(page));
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async openHome(): Promise<void> {
    await this.actor.attemptsTo(openLyhostHome());
  }

  async openManagerLogin(): Promise<void> {
    await this.actor.attemptsTo(openManagerLogin());
  }

  async openGuestArea(): Promise<void> {
    await this.actor.attemptsTo(openGuestArea());
  }

  async openGuestRegister(): Promise<void> {
    await this.actor.attemptsTo(openGuestRegister());
  }

  async openPropertiesPage(): Promise<void> {
    await this.actor.attemptsTo(openPropertiesPage());
  }

  async openPropertyUnits(propertyLocatorText: string): Promise<void> {
    await this.actor.attemptsTo(openPropertyUnits(propertyLocatorText));
  }

  async openIncidentReportPage(): Promise<void> {
    await this.actor.attemptsTo(openIncidentReportPage());
  }

  async openAuditLogPage(): Promise<void> {
    await this.actor.attemptsTo(openAuditLogPage());
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  async signInAsManager(credentials: LoginCredentials): Promise<void> {
    await this.actor.attemptsTo(signInAsManager(credentials));
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

  // ─── Properties ────────────────────────────────────────────────────────────

  async openCreatePropertyForm(): Promise<void> {
    await this.actor.attemptsTo(openCreatePropertyForm());
  }

  async createProperty(data: CreatePropertyData): Promise<void> {
    await this.actor.attemptsTo(
      openCreatePropertyForm(),
      fillPropertyForm(data),
      submitPropertyForm(),
    );
  }

  async deleteProperty(propertyName: string): Promise<void> {
    await this.actor.attemptsTo(deletePropertyByName(propertyName));
  }

  async createUnit(data: CreateUnitData): Promise<void> {
    await this.actor.attemptsTo(createUnit(data));
  }

  async deleteUnit(unitName: string): Promise<void> {
    await this.actor.attemptsTo(deleteUnitByName(unitName));
  }

  // ─── API Helpers (Clean Slate) ──────────────────────────────────────────────

  /**
   * Performs data setup via API before running UI flows.
   */
  async setupPropertyViaApi(apiClient: any, propertyData: any): Promise<any> {
    return await apiClient.createProperty(propertyData);
  }

  /**
   * Performs data cleanup via API after running UI flows.
   */
  async cleanupPropertyViaApi(apiClient: any, propertyId: string): Promise<void> {
    await apiClient.deleteProperty(propertyId);
  }

  // ─── Incident Reports ──────────────────────────────────────────────────────

  async createIncidentReport(data: CreateIncidentReportData): Promise<void> {
    await this.actor.attemptsTo(
      openCreateIncidentReportForm(),
      fillIncidentReportForm(data),
      submitIncidentReportForm(),
    );
  }

  async deleteIncidentReport(title: string): Promise<void> {
    await this.actor.attemptsTo(deleteIncidentReportByTitle(title));
  }

  // ─── Assertions ────────────────────────────────────────────────────────────

  async expectManagerDashboard(): Promise<void> {
    await expect(this.page.locator('section')).toMatchAriaSnapshot(DASHBOARD_ARIA_SNAPSHOT);
  }

  async expectManagerLoginError(message: string | RegExp): Promise<void> {
    await expect(await this.actor.asks(errorMessageFrom('app-login'))).toContainText(message);
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
