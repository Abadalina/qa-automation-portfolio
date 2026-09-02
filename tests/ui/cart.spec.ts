import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { USERS, PRODUCTS } from '../../fixtures/testData';

test.describe('Cart', () => {
  let inventory: InventoryPage;
  let cart: CartPage;

  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    inventory = new InventoryPage(page);
    cart = new CartPage(page);

    await login.goto();
    await login.login(USERS.standard.username, USERS.standard.password);
    await inventory.expectLoaded();
  });

  test('the cart starts empty', async () => {
    expect(await inventory.cartCount()).toBe(0);
  });

  test('adding a product updates the badge and the cart', async () => {
    await inventory.addToCart(PRODUCTS.backpack.id);
    expect(await inventory.cartCount()).toBe(1);

    await inventory.openCart();
    await cart.expectItems([PRODUCTS.backpack.name]);
  });

  test('adding several products keeps all of them', async () => {
    await inventory.addToCart(PRODUCTS.backpack.id);
    await inventory.addToCart(PRODUCTS.bikeLight.id);
    await inventory.addToCart(PRODUCTS.boltShirt.id);
    expect(await inventory.cartCount()).toBe(3);

    await inventory.openCart();
    await expect(cart.items).toHaveCount(3);
  });

  test('removing from the inventory page empties the cart', async () => {
    await inventory.addToCart(PRODUCTS.backpack.id);
    await inventory.removeFromCart(PRODUCTS.backpack.id);

    expect(await inventory.cartCount()).toBe(0);
    await inventory.openCart();
    await cart.expectEmpty();
  });

  test('removing from the cart page updates the badge', async () => {
    await inventory.addToCart(PRODUCTS.backpack.id);
    await inventory.addToCart(PRODUCTS.bikeLight.id);
    await inventory.openCart();

    await cart.removeItem(PRODUCTS.backpack.id);
    await cart.expectItems([PRODUCTS.bikeLight.name]);
    expect(await inventory.cartCount()).toBe(1);
  });

  test('the cart survives navigating away and back', async () => {
    await inventory.addToCart(PRODUCTS.backpack.id);
    await inventory.openCart();
    await cart.continueShoppingButton.click();
    await inventory.expectLoaded();

    expect(await inventory.cartCount()).toBe(1);
  });

  test('sorting by price low to high orders the catalogue', async () => {
    await inventory.sortBy('lohi');
    const prices = await inventory.prices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('sorting by price high to low orders the catalogue', async () => {
    await inventory.sortBy('hilo');
    const prices = await inventory.prices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });
});
