import { Page, Locator, expect } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.items = page.locator('[data-test="inventory-item"]');
    this.itemNames = page.locator('[data-test="inventory-item-name"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart.html');
  }

  removeButton(productId: string): Locator {
    return this.page.locator(`[data-test="remove-${productId}"]`);
  }

  async removeItem(productId: string): Promise<void> {
    await this.removeButton(productId).click();
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async expectItems(names: string[]): Promise<void> {
    await expect(this.itemNames).toHaveText(names);
  }

  async expectEmpty(): Promise<void> {
    await expect(this.items).toHaveCount(0);
  }
}
