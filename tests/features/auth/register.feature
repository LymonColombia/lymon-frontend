Feature: Guest registration and login

  Scenario: Guest registration succeeds
    Given guest opens registration form
    When guest creates account with valid data
    Then registration notice is visible

  Scenario: Guest registration rejects empty fields
    Given guest opens registration form
    When guest submits empty registration form
    Then guest sees field validation errors

  Scenario: Guest registration rejects short password
    Given guest opens registration form
    When guest submits short password
    Then guest sees password validation error

  Scenario: Guest registration rejects duplicate email
    Given guest opens registration form
    When guest submits duplicate email
    Then guest sees duplicate email message

  Scenario: Guest registration rejects invalid email
    Given guest opens registration form
    When guest submits invalid email
    Then guest sees email validation error

  Scenario: Guest registration requires name
    Given guest opens registration form
    When guest submits empty name
    Then guest sees name validation error