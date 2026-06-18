Feature: Property Creation

  Background:
    Given the manager is already authenticated in LyHost

  Scenario: Manager creates a new property
    Given the manager is on the Properties page
    When the manager fills and submits the property creation form
    Then the new property appears in the property list

  Scenario: Manager sees empty state before first property
    Given the manager has no properties registered
    When the manager is on the Properties page
    Then the "Crear primera propiedad" button is visible
