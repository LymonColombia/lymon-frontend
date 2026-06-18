import { expect, Page } from '@playwright/test';
import { BrowseTheWeb } from './abilities/browse-the-web.ability';
import { ManagerActor } from './actors/manager.actor';
import {
  openLyhostHome,
  openManagerLogin,
  signInAsManager,
  LoginCredentials,
} from './tasks/auth/login.task';
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
 * ManagerFlow — top-level facade for authenticated administrative scenarios.
 */
export class ManagerFlow {
  private readonly actor: ManagerActor;

  constructor(public readonly page: Page) {
    this.actor = ManagerActor.named('Manager', BrowseTheWeb.using(page));
  }

  async openHome(): Promise<void> {
    await this.actor.attemptsTo(openLyhostHome());
  }

  async openManagerLogin(): Promise<void> {
    await this.actor.attemptsTo(openManagerLogin());
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

  async signInAsManager(credentials: LoginCredentials): Promise<void> {
    await this.actor.attemptsTo(signInAsManager(credentials));
  }

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

  async asks<T>(question: any): Promise<T> {
    return this.actor.asks(question);
  }

  async setupPropertyViaApi(apiClient: any, propertyData: any): Promise<any> {
    return await apiClient.createProperty(propertyData);
  }

  async cleanupPropertyViaApi(apiClient: any, propertyId: string): Promise<void> {
    await apiClient.deleteProperty(propertyId);
  }

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

  async expectManagerDashboard(): Promise<void> {
    await expect(this.page.locator('section')).toMatchAriaSnapshot(DASHBOARD_ARIA_SNAPSHOT);
  }

  async expectManagerLoginError(message: string | RegExp): Promise<void> {
    await expect(await this.actor.asks(errorMessageFrom('app-login'))).toContainText(message);
  }
}
