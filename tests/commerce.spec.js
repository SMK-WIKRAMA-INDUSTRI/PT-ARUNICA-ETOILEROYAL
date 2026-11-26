import { expect, test } from '@playwright/test';

const imageFixture = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="#9d2b42"/><circle cx="320" cy="210" r="120" fill="#f3ad50"/></svg>`;

async function useEnglishDollars(page) {
  let openedMobileNav = false;
  let languageButton = page.getByRole('button', { name: /English/ });
  if (!(await languageButton.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    openedMobileNav = true;
    languageButton = page.getByRole('button', { name: /English/ });
  }
  await languageButton.click();
  await page.getByRole('button', { name: /US Dollar/ }).click();
  if (openedMobileNav) await page.keyboard.press('Escape');
}

async function signInDemo(page, role) {
  const signIn = page.getByRole('button', { name: 'Sign in', exact: true });
  if (await signIn.isVisible().catch(() => false)) {
    await signIn.click();
  } else {
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  }
  await page.getByRole('button', { name: role === 'admin' ? /Continue as admin/ : /Continue as member/ }).click();
}

async function addSpotlightToCart(page) {
  await page.locator('.spotlight').getByRole('button', { name: /Add to cart/ }).click();
  await expect(page.locator('.cart-badge')).toHaveText('1');
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://images.unsplash.com/**', (route) => route.fulfill({
    status: 200, contentType: 'image/svg+xml', body: imageFixture
  }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await useEnglishDollars(page);
});

test('a guest can build a cart and finish a sandbox demo checkout', async ({ page }) => {
  await addSpotlightToCart(page);
  await page.locator('.cart-button').click();
  await expect(page.getByRole('dialog', { name: /Your cart/ })).toBeVisible();

  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await expect(page.locator('.cart-line')).toHaveCount(1);
  await expect(page.locator('.qty-control span')).toHaveText('2');

  await page.getByRole('button', { name: /Checkout/ }).click();
  await expect(page.getByRole('dialog', { name: 'Almost at the fire.' })).toBeVisible();

  await page.locator('#co-name').fill('Rafi Test');
  await page.locator('#co-email').fill('rafi@example.com');
  await page.locator('#co-phone').fill('+62 812 3456 7890');

  // No Midtrans keys in the test environment: the labelled demo path is used.
  await expect(page.getByRole('button', { name: 'Run sandbox demo payment' })).toBeVisible();
  await page.getByRole('button', { name: 'Run sandbox demo payment' }).click();
  await expect(page.getByRole('heading', { name: 'Demo payment complete.' })).toBeVisible();
  await expect(page.locator('.success-facts')).toContainText('demo-paid');
  await expect(page.locator('.success-facts')).toContainText('ER-');
});

test('booking requires a member login while ordering stays open to guests', async ({ page }) => {
  const date = new Date(Date.now() + 2 * 86400000);
  if (date.getDay() === 1) date.setDate(date.getDate() + 1);
  const dateValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  await page.locator('#reservations').scrollIntoViewIfNeeded();
  await page.locator('#r-name').fill('Rafi Test');
  await page.locator('#r-email').fill('rafi@example.com');
  await page.locator('#r-phone').fill('+62 812 3456 7890');
  await page.locator('#r-date').fill(dateValue);
  await page.getByRole('button', { name: 'Prepare reservation email' }).click();

  await expect(page.getByRole('dialog', { name: 'Sign in to book your table' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Continue as guest/ })).toBeVisible();

  await page.getByRole('button', { name: /Continue as member/ }).click();
  await page.getByRole('button', { name: 'Prepare reservation email' }).click();
  await expect(page.getByRole('status')).toContainText('Your booking request was saved.');
});

async function openAdmin(page) {
  const adminButton = page.getByRole('button', { name: 'ADMIN', exact: true });
  if (await adminButton.isVisible().catch(() => false)) {
    await adminButton.click();
  } else {
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: /ADMIN/ }).click();
  }
  await expect(page).toHaveURL(/\/admin(?:\?|$)/);
  await expect(page.locator('.admin-shell')).toBeVisible();
}

async function clickAdminNav(page, label) {
  const toggle = page.locator('.admin-menu-toggle');
  if (await toggle.isVisible().catch(() => false)
    && (await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
  await page.locator('.admin-nav').getByRole('button', { name: label }).click();
}

test('a demo admin sees orders and booking requests on the dashboard', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('etoile.orders', JSON.stringify([{
      orderRef: 'ER-DEMO-0042',
      customerName: 'Rafi Test',
      customerEmail: 'rafi@example.com',
      customerPhone: '+62 812 3456 7890',
      items: [{ id: 'wagyu-ribeye', name: 'Miyazaki Ribeye', qty: 1, unitPriceEur: 95, unitPriceIdr: 1662500 }],
      subtotalIdr: 1662500,
      totalEur: 95,
      displayCurrency: 'USD',
      status: 'demo-paid',
      paymentProvider: 'midtrans-demo',
      createdAt: new Date().toISOString()
    }]));
    localStorage.setItem('etoile.bookings', JSON.stringify([{
      bookingRef: 'BK-DEMO01',
      guestName: 'Rafi Test',
      guestEmail: 'rafi@example.com',
      guestPhone: '+62 812 3456 7890',
      bookingDate: '2026-12-01',
      bookingTime: '19:30',
      guests: '2 Guests',
      seating: 'Le Grand Salon',
      dishId: 'wagyu-ribeye',
      status: 'requested',
      createdAt: new Date().toISOString()
    }]));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await useEnglishDollars(page);

  await signInDemo(page, 'admin');
  await openAdmin(page);

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.locator('.admin-list').first()).toContainText('ER-DEMO-0042');
  await clickAdminNav(page, 'Bookings');
  await expect(page.locator('.admin-list')).toContainText('Rafi Test');
  await expect(page.locator('.admin-list')).toContainText('2026-12-01');
});

test('a demo admin can manage categories, products and the restaurant profile', async ({ page }) => {
  await signInDemo(page, 'admin');
  await openAdmin(page);

  await clickAdminNav(page, 'Categories');
  await page.locator('.admin-split').getByLabel('Category ID').fill('test-pairings');
  await page.locator('.admin-split').getByLabel('Name (EN)').fill('Test Pairings');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.admin-table')).toContainText('Test Pairings');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('.admin-table-row').filter({ hasText: 'Test Pairings' }).getByRole('button', { name: 'Remove' }).click();
  await expect(page.locator('.admin-table')).not.toContainText('Test Pairings');

  await clickAdminNav(page, 'Products');
  await page.locator('input').first().fill('Smoked Duck测试');
  await page.locator('.admin-form select').selectOption({ label: 'Signature Steaks' });
  await page.locator('input[type="number"]').first().fill('88');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.admin-table')).toContainText('Smoked Duck测试');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('.admin-table-row').filter({ hasText: 'Smoked Duck测试' }).getByRole('button', { name: 'Remove' }).click();
  await expect(page.locator('.admin-table')).not.toContainText('Smoked Duck测试');

  await clickAdminNav(page, 'Restaurant profile');
  await page.getByLabel('Restaurant name').fill('ÉTOILE TEST');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.admin-brand')).toContainText('ÉTOILE TEST');
});
