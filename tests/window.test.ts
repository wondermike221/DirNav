import { test, expect } from '@playwright/test';
import { DirnavDevPage } from './dirnav-dev-page';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173');
});

test.describe('Window component', () => {
  let dirnavDevPage: DirnavDevPage;

  test.beforeEach(async ({ page }) => {
    dirnavDevPage = new DirnavDevPage(page);
  });

  test('should render with the correct title', async ({ page }) => {
    await expect(dirnavDevPage.title).toHaveText('~');
  });

  test('should be draggable', async ({ page }) => {
    const windowEl = dirnavDevPage.window;
    const initialPosition = await windowEl.boundingBox();
    expect(initialPosition).not.toBeNull();
    await dirnavDevPage.dragTo(100, 100);
    const finalPosition = await windowEl.boundingBox();
    expect(finalPosition).not.toBeNull();
    expect(finalPosition!.x).toBeLessThanOrEqual(initialPosition!.x);
    expect(finalPosition!.y).toBeLessThanOrEqual(initialPosition!.y);
  });

  test('should be resizable', async ({ page }) => {
    const windowEl = dirnavDevPage.window;
    const initialSize = await windowEl.boundingBox();
    expect(initialSize).not.toBeNull();
    await dirnavDevPage.resizeTo(100, 100);
    const finalSize = await windowEl.boundingBox();
    expect(finalSize).not.toBeNull();
    expect(finalSize!.width).toBeGreaterThanOrEqual(100);
    expect(finalSize!.height).toBeGreaterThanOrEqual(100);
  });

  test('should reset to default size and position', async ({ page }) => {
    await dirnavDevPage.dragTo(100, 100);
    await dirnavDevPage.reset();
    const boundingBox = await dirnavDevPage.window.boundingBox();
    const viewport = page.viewportSize();
    expect(boundingBox).not.toBeNull();
    // Check that the position is close to the default
    expect(boundingBox!.x).toBeCloseTo(viewport!.width * 0.375, 1);
    expect(boundingBox!.y).toBeCloseTo(viewport!.height * 0.375, 1);
  });

  test('should close when the close button is clicked', async ({ page }) => {
    await dirnavDevPage.close();
    await expect(dirnavDevPage.window).not.toBeVisible();
  });
});
