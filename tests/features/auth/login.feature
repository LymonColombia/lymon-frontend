Feature: Manager and guest login

  Scenario: Manager login succeeds
    Given manager opens Lyhost landing page
    When manager signs in with valid credentials
    Then dashboard is visible

  Scenario: Manager login rejects invalid email
    Given manager opens Lyhost landing page
    When manager signs in with invalid email
    Then manager sees validation error

  Scenario: Manager login rejects wrong password
    Given manager opens Lyhost landing page
    When manager signs in with wrong password
    Then manager sees authentication error

  Scenario: Manager login rejects wrong user
    Given manager opens Lyhost landing page
    When manager signs in with unknown email
    Then manager sees authentication error

  Scenario: Manager login requires email
    Given manager opens Lyhost landing page
    When manager submits password only
    Then manager sees required email message

  Scenario: Manager login requires password
    Given manager opens Lyhost landing page
    When manager submits email only
    Then manager sees required password message