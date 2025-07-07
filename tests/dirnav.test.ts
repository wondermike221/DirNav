import { test, expect } from '@playwright/test';
import { DirnavDevPage } from './dirnav-dev-page';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173');
});

test.describe('DirnavUI component', () => {
  let dirnavDevPage: DirnavDevPage;

  test.beforeEach(async ({ page }) => {
    dirnavDevPage = new DirnavDevPage(page);
  });

  test('should navigate into a directory and back', async ({ page }) => {
    await page.click('text=folder1/');
    await expect(page.locator('.breadcrumbs-container')).toHaveText(/~\/folder1/);
    await page.click('button:has-text("←")');
    await expect(page.locator('.breadcrumbs-container')).toHaveText('~');
  });

  test('should open and close the command palette', async ({ page }) => {
    await page.keyboard.press('`');
    await expect(page.locator('input[placeholder="Search..."]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('input[placeholder="Search..."]')).not.toBeVisible();
  });

  test('should filter results in the command palette', async ({ page }) => {
    await page.keyboard.press('`');
    await page.fill('input[placeholder="Search..."]', 'file1');
    await expect(page.locator('div:has-text("file1.txt")')).toBeVisible();
    await expect(page.locator('div:has-text("file2.txt")')).not.toBeVisible();
  });

  test('should handle input nodes', async ({ page }) => {
    await page.click('text=myInput');
    await page.fill('input[type="text"]', 'test value');
    await page.click('button:has-text("Save")');
    const localStorageValue = await page.evaluate(() => localStorage.getItem('myInputKey'));
    expect(localStorageValue).toBe('test value');
  });

  test('should handle virtual directories', async ({ page }) => {
    await page.click('text=virtual-folder');
    await expect(page.locator('text=Loading...')).toBeVisible();
    await expect(page.locator('text=file.txt')).toBeVisible();
  });
});
