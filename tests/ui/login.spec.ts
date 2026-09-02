import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { USERS, PASSWORD, ERRORS } from '../../fixtures/testData';

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // --- Happy path ---

  test('valid credentials log the user in', async ({ page }) => {
    await loginPage.login(USERS.standard.username, USERS.standard.password);
    await new InventoryPage(page).expectLoaded();
  });

  // --- Negative cases ---

  test('wrong password shows an error', async () => {
    await loginPage.login(USERS.standard.username, 'wrong-password');
    await loginPage.expectError(ERRORS.badCredentials);
  });

  test('empty username shows an error', async () => {
    await loginPage.login('', PASSWORD);
    await loginPage.expectError(ERRORS.noUsername);
  });

  test('empty password shows an error', async () => {
    await loginPage.login(USERS.standard.username, '');
    await loginPage.expectError(ERRORS.noPassword);
  });

  test('locked out user cannot log in', async () => {
    await loginPage.login(USERS.lockedOut.username, USERS.lockedOut.password);
    await loginPage.expectError(ERRORS.lockedOut);
  });

  // --- Security ---

  test('error message does not reveal whether the account exists', async () => {
    // A wrong password on a real account and a username that does not exist at
    // all must produce the same message, otherwise the form can be used to
    // enumerate valid accounts.
    await loginPage.login('does_not_exist_12345', PASSWORD);
    const unknownUserError = await loginPage.errorMessage.innerText();

    await loginPage.goto();
    await loginPage.login(USERS.standard.username, 'wrong-password');
    const wrongPasswordError = await loginPage.errorMessage.innerText();

    expect(unknownUserError).toBe(wrongPasswordError);
  });

  test('protected page cannot be reached without a session', async ({ page }) => {
    // Direct navigation must not bypass authentication.
    await page.goto('/inventory.html');
    await loginPage.expectError('You can only access');
    await expect(page).not.toHaveURL(/inventory\.html/);
  });

  test('logging out ends the session', async ({ page }) => {
    await loginPage.login(USERS.standard.username, USERS.standard.password);
    const inventory = new InventoryPage(page);
    await inventory.expectLoaded();

    await inventory.logout();
    await loginPage.expectLoggedOut();

    // Going back must not restore an authenticated view.
    await page.goto('/inventory.html');
    await expect(page).not.toHaveURL(/inventory\.html/);
  });
});
