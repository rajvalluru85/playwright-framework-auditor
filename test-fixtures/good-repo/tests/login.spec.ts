import { test, expect } from '../src/fixtures/base';

test('user can login', async ({ loginPage }) => {
  await loginPage.login('demo', 'secret');
  await expect(loginPage.page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});
