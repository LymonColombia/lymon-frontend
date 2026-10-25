Feature: Manual Reservation and Guest Registration

  Background:
    Given the manager is already authenticated in LyHost

  Scenario: Manager manually registers a new guest in the reservation wizard
    Given the manager is on the Reservations page
    When the manager opens the reservation wizard
    And selects that the guest is not registered
    And fills the new guest information with full name and primary email
    And advances to the next step
    Then the new guest is created and pre-selected in the reservation details step

  Scenario: Guest registration requires full name and email
    Given the manager is on the Reservations page
    When the manager opens the reservation wizard
    And selects that the guest is not registered
    Then the manager cannot advance without filling full name and primary email

  Scenario: Manager creates a manual reservation with a newly registered guest
    Given the manager is on the Reservations page
    When the manager opens the reservation wizard
    And registers a new guest with valid details
    And selects a property and unit for the stay
    And selects check-in and check-out dates
    And confirms the reservation
    Then the reservation is successfully created and appears in the list

  Scenario: Manager creates a manual reservation for an already registered guest
    Given the manager is on the Reservations page
    When the manager opens the reservation wizard
    And selects that the guest is already registered
    And selects an existing guest from the list
    And selects a property and unit for the stay
    And confirms the reservation
    Then the reservation is successfully created
