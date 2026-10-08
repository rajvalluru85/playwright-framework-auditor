import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.locator('#username').fill('demo');
  await page.locator('.password-field input').fill('secret');
  await page.waitForTimeout(3000);
  await page.locator('//button[@type="submit"]').click();
  await expect(page.locator('.welcome-banner')).toBeVisible();
});

test('user can logout', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.locator('#username').fill('demo');
  await page.locator('.password-field input').fill('secret');
  await page.waitForTimeout(3000);
  await page.locator('//button[@type="submit"]').click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page.getByText('Logged out')).toBeVisible();
});
