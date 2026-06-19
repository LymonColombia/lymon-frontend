const BASE_URL = 'https://lymon-backend-development.onrender.com';

function getAuthToken(): Cypress.Chainable<string> {
  return cy
    .env(['MANAGER_EMAIL', 'MANAGER_PASSWORD'])
    .then((envs) =>
      cy
        .request({
          method: 'POST',
          url: `${BASE_URL}/auth/login`,
          body: { email: envs['MANAGER_EMAIL'], password: envs['MANAGER_PASSWORD'] },
          failOnStatusCode: true,
        })
        .its('body.data.accessToken'),
    ) as Cypress.Chainable<string>;
}

export function apiLogin(email: string, password: string): Cypress.Chainable {
  return cy
    .request({
      method: 'POST',
      url: `${BASE_URL}/auth/login`,
      body: { email, password },
      failOnStatusCode: true,
    })
    .then((res) => {
      const { accessToken, refreshToken, email: userEmail, userId, tenantId } = res.body.data;
      cy.window().then((win) => {
        win.localStorage.setItem('lymon_access_token', accessToken);
        win.localStorage.setItem('lymon_refresh_token', refreshToken);
        win.localStorage.setItem(
          'lymon_current_user',
          JSON.stringify({ email: userEmail, userId, tenantId, emailVerified: false }),
        );
      });
    });
}

export function apiCreateProperty(data: Record<string, unknown>): Cypress.Chainable {
  return getAuthToken().then((token) =>
    cy.request({
      method: 'POST',
      url: `${BASE_URL}/properties`,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: data,
      failOnStatusCode: false,
    }),
  );
}

export function apiDeleteProperty(identifier: string): Cypress.Chainable {
  return getAuthToken().then((token) => {
    if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
      return cy.request({
        method: 'DELETE',
        url: `${BASE_URL}/properties/${identifier}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      });
    }

    return cy
      .request({
        method: 'GET',
        url: `${BASE_URL}/properties`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      })
      .then((res) => {
        const properties: Array<{ name: string; id?: string; _id?: string }> =
          res.body?.data || [];
        const matches = properties.filter((p) => p.name === identifier);
        matches.forEach((p) => {
          const id = p.id || p._id;
          if (!id) return;
          cy.request({
            method: 'DELETE',
            url: `${BASE_URL}/properties/${id}`,
            headers: { Authorization: `Bearer ${token}` },
            failOnStatusCode: false,
          });
        });
      });
  });
}

export function apiCreateUnit(data: Record<string, unknown>): Cypress.Chainable {
  return getAuthToken().then((token) =>
    cy.request({
      method: 'POST',
      url: `${BASE_URL}/units`,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: data,
      failOnStatusCode: false,
    }),
  );
}

export function apiDeleteUnit(unitId: string): Cypress.Chainable {
  return getAuthToken().then((token) =>
    cy.request({
      method: 'DELETE',
      url: `${BASE_URL}/units/${unitId}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }),
  );
}
