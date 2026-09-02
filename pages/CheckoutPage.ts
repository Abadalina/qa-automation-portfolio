import { Page, Locator, expect } from '@playwright/test';

/**
 * Covers the three steps of the Sauce Demo checkout: customer information,
 * order overview and confirmation. They share one flow, so keeping them in one
 * object avoids three classes that would always be used together.
 */
export class CheckoutPage {
  readonly page: Page;

  // Step one - customer information
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly errorMessage: Locator;

  // Step two - overview
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  readonly itemNames: Locator;

  // Step three - confirmation
  readonly completeHeader: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.errorMessage = page.locator('[data-test="error"]');

    this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
    this.taxLabel = page.locator('[data-test="tax-label"]');
    this.totalLabel = page.locator('[data-test="total-label"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.itemNames = page.locator('[data-test="inventory-item-name"]');

    this.completeHeader = page.locator('[data-test="complete-header"]');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
  }

  async fillCustomerInformation(first: string, last: string, postalCode: string): Promise<void> {
    await this.firstNameInput.fill(first);
    await this.lastNameInput.fill(last);
    await this.postalCodeInput.fill(postalCode);
    await this.continueButton.click();
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  async expectError(text: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(text);
  }

  async expectOrderComplete(): Promise<void> {
    await expect(this.page).toHaveURL(/checkout-complete/);
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
  }

  /** Parses "Item total: $29.99" style labels into a number. */
  private static parseAmount(label: string): number {
    const match = label.match(/\$([\d.]+)/);
    if (!match) throw new Error(`No amount found in "${label}"`);
    return Number(match[1]);
  }

  async subtotal(): Promise<number> {
    return CheckoutPage.parseAmount(await this.subtotalLabel.innerText());
  }

  async tax(): Promise<number> {
    return CheckoutPage.parseAmount(await this.taxLabel.innerText());
  }

  async total(): Promise<number> {
    return CheckoutPage.parseAmount(await this.totalLabel.innerText());
  }
}
