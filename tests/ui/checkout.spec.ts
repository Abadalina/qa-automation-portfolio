import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { USERS, PRODUCTS, CHECKOUT_CUSTOMER, TAX_RATE } from '../../fixtures/testData';

test.describe('Checkout', () => {
  let inventory: InventoryPage;
  let cart: CartPage;
  let checkout: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    inventory = new InventoryPage(page);
    cart = new CartPage(page);
    checkout = new CheckoutPage(page);

    await login.goto();
    await login.login(USERS.standard.username, USERS.standard.password);
    await inventory.expectLoaded();
  });

  test('a customer can complete a purchase end to end', async () => {
    await inventory.addToCart(PRODUCTS.backpack.id);
    await inventory.openCart();
    await cart.checkout();

    await checkout.fillCustomerInformation(
      CHECKOUT_CUSTOMER.firstName,
      CHECKOUT_CUSTOMER.lastName,
      CHECKOUT_CUSTOMER.postalCode,
    );
    await expect(checkout.itemNames).toHaveText([PRODUCTS.backpack.name]);

    await checkout.finish();
    await checkout.expectOrderComplete();
  });

  test('the order total is subtotal plus tax', async () => {
    await inventory.addToCart(PRODUCTS.backpack.id);
    await inventory.addToCart(PRODUCTS.bikeLight.id);
    await inventory.openCart();
    await cart.checkout();
    await checkout.fillCustomerInformation(
      CHECKOUT_CUSTOMER.firstName,
      CHECKOUT_CUSTOMER.lastName,
      CHECKOUT_CUSTOMER.postalCode,
    );

    const expectedSubtotal = PRODUCTS.backpack.price + PRODUCTS.bikeLight.price;
    expect(await checkout.subtotal()).toBeCloseTo(expectedSubtotal, 2);

    // Rounded to cents, the way the site displays it.
    const expectedTax = Math.round(expectedSubtotal * TAX_RATE * 100) / 100;
    expect(await checkout.tax()).toBeCloseTo(expectedTax, 2);
    expect(await checkout.total()).toBeCloseTo(expectedSubtotal + expectedTax, 2);
  });

  test('the cart is emptied after a completed order', async () => {
    await inventory.addToCart(PRODUCTS.backpack.id);
    await inventory.openCart();
    await cart.checkout();
    await checkout.fillCustomerInformation(
      CHECKOUT_CUSTOMER.firstName,
      CHECKOUT_CUSTOMER.lastName,
      CHECKOUT_CUSTOMER.postalCode,
    );
    await checkout.finish();
    await checkout.expectOrderComplete();

    await checkout.backHomeButton.click();
    expect(await inventory.cartCount()).toBe(0);
  });

  // --- Negative cases: the form must not let an incomplete order through ---

  test('checkout requires a first name', async () => {
    await inventory.addToCart(PRODUCTS.backpack.id);
    await inventory.openCart();
    await cart.checkout();

    await checkout.fillCustomerInformation('', CHECKOUT_CUSTOMER.lastName, CHECKOUT_CUSTOMER.postalCode);
    await checkout.expectError('First Name is required');
  });

  test('checkout requires a last name', async () => {
    await inventory.addToCart(PRODUCTS.backpack.id);
    await inventory.openCart();
    await cart.checkout();

    await checkout.fillCustomerInformation(CHECKOUT_CUSTOMER.firstName, '', CHECKOUT_CUSTOMER.postalCode);
    await checkout.expectError('Last Name is required');
  });

  test('checkout requires a postal code', async () => {
    await inventory.addToCart(PRODUCTS.backpack.id);
    await inventory.openCart();
    await cart.checkout();

    await checkout.fillCustomerInformation(CHECKOUT_CUSTOMER.firstName, CHECKOUT_CUSTOMER.lastName, '');
    await checkout.expectError('Postal Code is required');
  });
});
