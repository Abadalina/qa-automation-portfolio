import { test, expect, APIRequestContext } from '@playwright/test';
import { API_BASE, ADMIN, newBooking } from '../../fixtures/apiData';

async function getToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API_BASE}/auth`, { data: ADMIN });
  expect(response.status()).toBe(200);
  return (await response.json()).token;
}

async function createBooking(request: APIRequestContext, overrides = {}) {
  const payload = newBooking(overrides);
  const response = await request.post(`${API_BASE}/booking`, { data: payload });
  expect(response.status()).toBe(200);
  const body = await response.json();
  return { id: body.bookingid as number, payload, body };
}

test.describe('Booking API', () => {
  // --- Read ---

  test('GET /booking returns 200 and a list of ids', async ({ request }) => {
    const response = await request.get(`${API_BASE}/booking`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('bookingid');
  });

  test('GET a non-existent booking returns 404', async ({ request }) => {
    const response = await request.get(`${API_BASE}/booking/99999999`);
    expect(response.status()).toBe(404);
  });

  // --- Create ---

  test('POST /booking creates a booking and echoes the payload back', async ({ request }) => {
    const { id, payload, body } = await createBooking(request);

    expect(typeof id).toBe('number');
    // Assert the whole object, not just one field: a partial check hides a
    // service that silently drops or reorders data.
    expect(body.booking).toEqual(payload);
  });

  test('a created booking can be read back', async ({ request }) => {
    const { id, payload } = await createBooking(request, { firstname: 'Roundtrip' });

    const response = await request.get(`${API_BASE}/booking/${id}`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(payload);
  });

  test('POST with a missing required field is rejected', async ({ request }) => {
    const { firstname, ...incomplete } = newBooking();
    const response = await request.post(`${API_BASE}/booking`, { data: incomplete });

    expect(response.status()).toBe(500);
  });

  // --- Update and delete, with authorisation ---

  test('PUT updates a booking when authenticated', async ({ request }) => {
    const { id } = await createBooking(request);
    const token = await getToken(request);
    const updated = newBooking({ firstname: 'Updated', totalprice: 999 });

    const response = await request.put(`${API_BASE}/booking/${id}`, {
      headers: { Cookie: `token=${token}` },
      data: updated,
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(updated);
  });

  test('DELETE removes a booking when authenticated', async ({ request }) => {
    const { id } = await createBooking(request);
    const token = await getToken(request);

    const deleted = await request.delete(`${API_BASE}/booking/${id}`, {
      headers: { Cookie: `token=${token}` },
    });
    expect(deleted.status()).toBe(201);

    const readBack = await request.get(`${API_BASE}/booking/${id}`);
    expect(readBack.status()).toBe(404);
  });

  // --- Authorisation: the destructive endpoints must be protected ---

  test('PUT without a token returns 403', async ({ request }) => {
    const { id } = await createBooking(request);

    const response = await request.put(`${API_BASE}/booking/${id}`, { data: newBooking() });
    expect(response.status()).toBe(403);
  });

  test('DELETE without a token returns 403', async ({ request }) => {
    const { id } = await createBooking(request);

    const response = await request.delete(`${API_BASE}/booking/${id}`);
    expect(response.status()).toBe(403);
  });

  test('DELETE with a forged token returns 403', async ({ request }) => {
    const { id } = await createBooking(request);

    const response = await request.delete(`${API_BASE}/booking/${id}`, {
      headers: { Cookie: 'token=deadbeefdeadbeef' },
    });
    expect(response.status()).toBe(403);

    // And the booking is still there.
    const readBack = await request.get(`${API_BASE}/booking/${id}`);
    expect(readBack.status()).toBe(200);
  });

  // --- Filtering ---

  test('GET /booking filters by name', async ({ request }) => {
    const unique = `Filter${Date.now()}`;
    const { id } = await createBooking(request, { firstname: unique });

    const response = await request.get(`${API_BASE}/booking`, {
      params: { firstname: unique },
    });

    expect(response.status()).toBe(200);
    const ids = (await response.json()).map((b: { bookingid: number }) => b.bookingid);
    expect(ids).toContain(id);
  });
});
