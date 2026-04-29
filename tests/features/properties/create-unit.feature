Feature: Unit Creation

  Background:
    Given the manager is already authenticated in LyHost

  Scenario: Manager creates a unit from the properties page
    Given the manager is logged into LyHost
    When the manager opens the Hotel Viltrum units page
    And the manager creates the new unit
    Then the unit appears in the property units list
