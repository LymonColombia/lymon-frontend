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

export class ManagerFlow {
  private readonly actor: ManagerActor;

  constructor() {
    this.actor = ManagerActor.named('Manager');
  }

  openHome(): void {
    this.actor.attemptsTo(openLyhostHome());
  }

  openManagerLogin(): void {
    this.actor.attemptsTo(openManagerLogin());
  }

  openPropertiesPage(): void {
    this.actor.attemptsTo(openPropertiesPage());
  }

  openPropertyUnits(propertyLocatorText: string): void {
    this.actor.attemptsTo(openPropertyUnits(propertyLocatorText));
  }

  openIncidentReportPage(): void {
    this.actor.attemptsTo(openIncidentReportPage());
  }

  openAuditLogPage(): void {
    this.actor.attemptsTo(openAuditLogPage());
  }

  signInAsManager(credentials: LoginCredentials): void {
    this.actor.attemptsTo(signInAsManager(credentials));
  }

  createProperty(data: CreatePropertyData): void {
    this.actor.attemptsTo(openCreatePropertyForm(), fillPropertyForm(data), submitPropertyForm());
  }

  deleteProperty(propertyName: string): void {
    this.actor.attemptsTo(deletePropertyByName(propertyName));
  }

  createUnit(data: CreateUnitData): void {
    this.actor.attemptsTo(createUnit(data));
  }

  deleteUnit(unitName: string): void {
    this.actor.attemptsTo(deleteUnitByName(unitName));
  }

  createIncidentReport(data: CreateIncidentReportData): void {
    this.actor.attemptsTo(
      openCreateIncidentReportForm(),
      fillIncidentReportForm(data),
      submitIncidentReportForm(),
    );
  }

  deleteIncidentReport(title: string): void {
    this.actor.attemptsTo(deleteIncidentReportByTitle(title));
  }

  expectManagerDashboard(): void {
    cy.contains('h1', 'Dashboard').should('be.visible');
    cy.get('section').contains('Resumen general').should('exist');
  }

  expectManagerLoginError(message: string | RegExp): void {
    this.actor.asks(errorMessageFrom('app-login')).contains(message as string).should('exist');
  }
}
