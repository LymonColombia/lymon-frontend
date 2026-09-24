Feature: Audit Log

  Background:
    Given the manager is already authenticated in LyHost

  Scenario: Audit log list is visible and contains entries
    Given the manager is on the Dashboard
    When the manager navigates to Audit Log via the sidebar
    Then the Audit Log page heading is visible
    And the list contains at least one timestamped entry
