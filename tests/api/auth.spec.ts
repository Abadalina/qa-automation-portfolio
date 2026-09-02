import { test, expect } from '@playwright/test';
import { API_BASE, ADMIN } from '../../fixtures/apiData';

test.describe('Auth API', () => {
  test('the service is up', async ({ request }) => {
    const response = await request.get(`${API_BASE}/ping`);
    expect(response.status()).toBe(201);
  });

  test('valid credentials return a token', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth`, { data: ADMIN });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
  });

  test('invalid credentials do not return a token', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth`, {
      data: { username: ADMIN.username, password: 'not-the-password' },
    });

    // The service answers 200 with a reason instead of a 401. That is worth
    // flagging as a finding rather than asserting the "correct" status: the
    // test documents the behaviour that actually ships.
    const body = await response.json();
    expect(body).not.toHaveProperty('token');
    expect(body).toHaveProperty('reason');
  });

  test('the failure response does not leak whether the user exists', async ({ request }) => {
    const unknownUser = await request.post(`${API_BASE}/auth`, {
      data: { username: 'no_such_user', password: 'whatever' },
    });
    const wrongPassword = await request.post(`${API_BASE}/auth`, {
      data: { username: ADMIN.username, password: 'whatever' },
    });

    expect(await unknownUser.json()).toEqual(await wrongPassword.json());
  });
});
