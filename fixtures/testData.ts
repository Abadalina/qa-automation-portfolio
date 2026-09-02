/**
 * Centralised test data.
 *
 * These are the public demo credentials published by saucedemo.com on its own
 * login page, so committing them here is harmless. In a real project the same
 * data would come from environment variables or a secrets store and never be
 * committed - the point of this file is the indirection, not the values.
 */
export const USERS = {
  standard:   { username: 'standard_user',    password: 'secret_sauce' },
  lockedOut:  { username: 'locked_out_user',  password: 'secret_sauce' },
  problem:    { username: 'problem_user',     password: 'secret_sauce' },
  performance:{ username: 'performance_glitch_user', password: 'secret_sauce' },
} as const;

export const PASSWORD = 'secret_sauce';

export const ERRORS = {
  badCredentials: 'Username and password do not match any user in this service',
  noUsername: 'Username is required',
  noPassword: 'Password is required',
  lockedOut: 'Sorry, this user has been locked out',
} as const;

export const PRODUCTS = {
  backpack:  { id: 'sauce-labs-backpack',   name: 'Sauce Labs Backpack',   price: 29.99 },
  bikeLight: { id: 'sauce-labs-bike-light', name: 'Sauce Labs Bike Light', price: 9.99 },
  boltShirt: { id: 'sauce-labs-bolt-t-shirt', name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
} as const;

export const CHECKOUT_CUSTOMER = {
  firstName: 'Alex',
  lastName: 'Tester',
  postalCode: '08001',
} as const;

/** Sauce Demo applies a fixed 8% sales tax to the subtotal. */
export const TAX_RATE = 0.08;
