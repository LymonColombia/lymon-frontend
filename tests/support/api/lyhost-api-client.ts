import { APIRequestContext, expect } from '@playwright/test';

/**
 * LyhostApiClient
 *
 * A thin wrapper around the Backend API to handle data setup and teardown
 * for E2E tests. This follows the "Clean Slate" approach using API calls
 * before/after UI tests.
 */
export class LyhostApiClient {
  private baseUrl = 'https://lymon-backend-development.onrender.com';
  private authToken: string | null = null;

  constructor(private request: APIRequestContext) {}

  /**
   * Register a new tenant/user
   */
  async registerTenant(data: any) {
    const response = await this.request.post(`${this.baseUrl}/auth/register`, {
      data,
    });
    // We expect 201 Created or 409 if already exists (depends on API behavior)
    expect(response.status()).toBeLessThan(300);
    return response.json();
  }

  /**
   * Login to get token and update storageState for UI
   */
  async login(email: string, password: string, page?: import('@playwright/test').Page) {
    const response = await this.request.post(`${this.baseUrl}/auth/login`, {
      data: { email, password },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    console.log('🚀 ~ LyhostApiClient ~ login ~ body:', body);
    this.authToken = body.data.accessToken;

    if (page && body) {
      const accessToken = body.data.accessToken;
      const refreshToken = body.data.refreshToken; // fallback to access token if no refresh token
      const user = {
        email: body.data.email,
        userId: body.data.userId,
        tenantId: body.data.tenantId,
        emailVerified: false,
      };

      await page.context().addInitScript(
        ({ token, refresh, userData }) => {
          window.localStorage.setItem('lymon_access_token', token);
          window.localStorage.setItem('lymon_refresh_token', refresh);
          window.localStorage.setItem('lymon_current_user', JSON.stringify(userData));
        },
        { token: accessToken, refresh: refreshToken, userData: user },
      );
    }

    return body;
  }

  /**
   * Delete the current tenant/user
   */
  async deleteTenant() {
    const response = await this.request.delete(`${this.baseUrl}/tenant`, {
      headers: this.getAuthHeader(),
    });
    expect(response.ok()).toBeTruthy();
  }

  /**
   * Create a property (pre-requisite for units)
   */
  async createProperty(propertyData: any) {
    await this.ensureAuth();
    const response = await this.request.post(`${this.baseUrl}/properties`, {
      data: propertyData,
      headers: this.getAuthHeader(),
    });
    if (!response.ok()) {
      const errBody = await response.text();
      console.error(
        `Failed to create property via API. Status: ${response.status()}, Body: ${errBody}`,
      );
    }
    console.log('🚀 ~ LyhostApiClient ~ createProperty ~ response:', await response.json());
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Delete a property by ID or Name (Deletes ALL matches if name provided)
   */
  async deleteProperty(identifier: string) {
    await this.ensureAuth();

    // If it looks like a MongoId, use it directly
    if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
      const response = await this.request.delete(`${this.baseUrl}/properties/${identifier}`, {
        headers: this.getAuthHeader(),
      });
      expect(response.ok()).toBeTruthy();
      return;
    }

    // Otherwise, search for property by name and delete all matches
    const listResponse = await this.request.get(`${this.baseUrl}/properties`, {
      headers: this.getAuthHeader(),
    });

    if (!listResponse.ok()) {
      console.error(`Failed to list properties: ${listResponse.status()}`);
      return;
    }

    const json = await listResponse.json();
    const properties = json?.data || [];
    const matchingProperties = properties.filter((p: any) => p.name === identifier);

    for (const property of matchingProperties) {
      const propertyId = property.id || property._id;
      if (!propertyId) {
        console.error(`Property found but no ID available for: ${identifier}`, property);
        continue;
      }
      const delResponse = await this.request.delete(`${this.baseUrl}/properties/${propertyId}`, {
        headers: this.getAuthHeader(),
      });
      if (!delResponse.ok()) {
        console.error(`Failed to delete property ${propertyId}: ${delResponse.status()}`);
      } else {
        console.log(`Successfully deleted property: ${identifier} (${propertyId})`);
      }
    }
  }

  /**
   * Create a unit
   */
  async createUnit(unitData: any) {
    await this.ensureAuth();
    const response = await this.request.post(`${this.baseUrl}/units`, {
      data: unitData,
      headers: this.getAuthHeader(),
    });
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Delete a unit
   */
  async deleteUnit(unitId: string) {
    await this.ensureAuth();
    const response = await this.request.delete(`${this.baseUrl}/units/${unitId}`, {
      headers: this.getAuthHeader(),
    });
    expect(response.ok()).toBeTruthy();
  }

  /**
   * Delete a unit
   */
  async deleteUnit(unitId: string) {
    const response = await this.request.delete(`${this.baseUrl}/units/${unitId}`, {
      headers: this.getAuthHeader(),
    });
    expect(response.ok()).toBeTruthy();
  }

  /**
   * Helper to ensure we have a valid token (uses env credentials)
   */
  private async ensureAuth() {
    if (this.authToken) return;

    // Use .env variables - fallback to defaults if they don't exist
    const email = process.env.MANAGER_EMAIL;
    const password = process.env.MANAGER_PASSWORD;

    if (!email || !password) {
      throw new Error('MANAGER_EMAIL and MANAGER_PASSWORD must be set in .env for API cleanup');
    }

    const response = await this.request.post(`${this.baseUrl}/auth/login`, {
      data: { email, password },
    });

    if (!response.ok()) {
      const errorBody = await response.text();
      console.error(`API login failed for cleanup: ${response.status()} - ${errorBody}`);
      throw new Error(`Failed to authenticate for API cleanup with ${email}`);
    }

    const body = await response.json();
    this.authToken = body.data.accessToken;
  }

  private getAuthHeader() {
    return this.authToken
      ? {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }
      : {};
  }
}
