import { Page, Locator, expect } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly sortDropdown: Locator;
  readonly burgerMenuButton: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.items = page.locator('[data-test="inventory-item"]');
    this.itemNames = page.locator('[data-test="inventory-item-name"]');
    this.itemPrices = page.locator('[data-test="inventory-item-price"]');
    this.cartLink = page.locator('[data-test="shopping-cart-link"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.burgerMenuButton = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('[data-test="logout-sidebar-link"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory.html');
  }

  addToCartButton(productId: string): Locator {
    return this.page.locator(`[data-test="add-to-cart-${productId}"]`);
  }

  removeButton(productId: string): Locator {
    return this.page.locator(`[data-test="remove-${productId}"]`);
  }

  async addToCart(productId: string): Promise<void> {
    await this.addToCartButton(productId).click();
  }

  async removeFromCart(productId: string): Promise<void> {
    await this.removeButton(productId).click();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  async logout(): Promise<void> {
    await this.burgerMenuButton.click();
    await this.logoutLink.click();
  }

  /** Cart badge count, or 0 when the badge is not rendered at all. */
  async cartCount(): Promise<number> {
    if (await this.cartBadge.count() === 0) return 0;
    return Number(await this.cartBadge.innerText());
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory\.html/);
    await expect(this.items.first()).toBeVisible();
  }

  async prices(): Promise<number[]> {
    const raw = await this.itemPrices.allInnerTexts();
    return raw.map((p) => Number(p.replace('$', '')));
  }
}
