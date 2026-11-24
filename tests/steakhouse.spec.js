import { expect, test } from '@playwright/test';

const imageFixture = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="#9d2b42"/><circle cx="320" cy="210" r="120" fill="#f3ad50"/></svg>`;
const pageErrorsByPage = new WeakMap();
const consoleErrorsByPage = new WeakMap();

// The UI ships in Indonesian + Rupiah by default. Switch to English + US Dollar
// so the interaction assertions stay in one predictable locale.
async function useEnglishDollars(page) {
  // Labels are localised too, so match the language name rather than "Language:".
  let openedMobileNav = false;
  let languageButton = page.getByRole('button', { name: /English/ });
  if (!(await languageButton.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    openedMobileNav = true;
    languageButton = page.getByRole('button', { name: /English/ });
  }
  await languageButton.click();
  await page.getByRole('button', { name: /US Dollar/ }).click();
  // The mobile sheet otherwise stays open and covers the flipbook controls.
  if (openedMobileNav) await page.keyboard.press('Escape');
}

test.beforeEach(async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  pageErrorsByPage.set(page, pageErrors);
  consoleErrorsByPage.set(page, consoleErrors);
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://images.unsplash.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'image/svg+xml',
    body: imageFixture
  }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await useEnglishDollars(page);
});

test('renders a lightweight dish showcase without WebGL', async ({ page }) => {
  await expect(page.locator('.stage-canvas canvas')).toHaveCount(0);
  const cards = page.locator('.showcase-card');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(1);

  await cards.nth(1).click();
  await expect(cards.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.spot-title')).toHaveText('Royal Tomahawk Steak');
  await expect(page.getByRole('button', { name: 'Book with this dish' })).toBeVisible();

  expect(pageErrorsByPage.get(page)).toEqual([]);
  expect(consoleErrorsByPage.get(page)).toEqual([]);
});

test('flips the image-first menu with its page controls', async ({ page }) => {
  await page.locator('#menu').scrollIntoViewIfNeeded();
  const firstImage = page.locator('.book-page').first().locator('img');
  await expect(firstImage).toBeVisible();
  await expect.poll(() => firstImage.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(page.locator('.flipbook-progress')).toContainText('02 /');
  await expect(page.locator('.book-page')).toHaveCount(2);
});

test('opens the AI sommelier and adds a recommendation to the reservation', async ({ page }) => {
  await page.getByRole('button', { name: /Ask the Sommelier/ }).click();
  await expect(page.getByRole('dialog', { name: 'ÉTOILE AI Sommelier' })).toBeVisible();
  await expect(page.locator('.recommendation-card')).toHaveCount(2);
  await page.locator('.recommendation-card').first().getByRole('button', { name: 'Add to reservation' }).click();
  await expect(page.locator('.toast')).toContainText('added to your reservation request.');
  await page.getByRole('button', { name: 'Pair a cut with a bold red' }).click();
  await expect(page.locator('.msg-assistant').last()).toContainText('Royal Tomahawk Steak');
});

test('allows a mobile swipe to turn the menu page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile viewport coverage only');
  await page.locator('#menu').scrollIntoViewIfNeeded();
  const spread = page.locator('.flipbook-spread');
  await expect(spread.locator('.book-page').first()).toBeVisible();
  const box = await spread.boundingBox();
  await spread.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: box.x + box.width * 0.8 });
  await spread.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', clientX: box.x + box.width * 0.2 });
  await expect(page.locator('.flipbook-progress')).toContainText('02 /');
  await expect(spread.locator('.book-page').first().locator('img')).toBeVisible();
});

test('validates reservation fields before preparing an email', async ({ page }) => {
  await page.locator('#reservations').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Prepare reservation email' }).click();
  await expect(page.getByRole('alert')).toContainText('Please add your name, email, phone number and a date.');
  await expect(page.locator('.schedule-card').filter({ hasText: 'Long lunch' })).toBeVisible();
  await expect(page.locator('.seat-chip', { hasText: 'Grill-side' })).toBeVisible();
});
