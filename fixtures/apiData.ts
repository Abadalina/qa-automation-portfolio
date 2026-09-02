/**
 * Restful Booker test data.
 *
 * `admin / password123` are the fixed public credentials of the demo service,
 * documented on restful-booker.herokuapp.com/apidoc. In a real project they
 * would come from environment variables.
 */
export const API_BASE = process.env.API_BASE_URL ?? 'https://restful-booker.herokuapp.com';

export const ADMIN = {
  username: 'admin',
  password: 'password123',
} as const;

export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
  additionalneeds?: string;
}

export function newBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: 'Alex',
    lastname: 'Tester',
    totalprice: 150,
    depositpaid: true,
    bookingdates: { checkin: '2026-10-01', checkout: '2026-10-05' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
