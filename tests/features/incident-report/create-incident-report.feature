Feature: Incident Report Creation

  Background:
    Given the manager is already authenticated in LyHost

  Scenario: Manager creates a new incident report
    Given the manager is on the Incident Report list page
    When the manager fills and submits the incident report form
    Then the new incident report appears in the list
