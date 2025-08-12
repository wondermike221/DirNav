import { test, expect } from '@playwright/test';
import { setupTest, teardownTest } from './test-setup';

test.describe('Basic functionality', () => {
  test('should load the test page correctly', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toBe('Solid Dirnav UI Example');
    
    // Check that the shadow DOM host is created
    await page.waitForSelector('#dirnav-host');
    const hostExists = await page.locator('#dirnav-host').isVisible();
    expect(hostExists).toBe(true);
  });

  test('should initialize component in shadow DOM', async ({ page }) => {
    const helper = await setupTest(page);
    
    // Check that shadow root exists
    const shadowRootExists = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      return !!host?.shadowRoot;
    });
    
    expect(shadowRootExists).toBe(true);
    
    // Check that styles are injected
    const stylesExist = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      return !!shadowRoot?.querySelector('style');
    });
    
    expect(stylesExist).toBe(true);
    
    await teardownTest(page);
  });

  test('should have validation functions available globally', async ({ page }) => {
    await setupTest(page);
    
    const functionsAvailable = await page.evaluate(() => {
      return {
        validateDirectoryTree: typeof (window as any).validateDirectoryTree === 'function',
        validateDirectoryTreeStrict: typeof (window as any).validateDirectoryTreeStrict === 'function',
        createDirTree: typeof (window as any).createDirTree === 'function'
      };
    });
    
    expect(functionsAvailable.validateDirectoryTree).toBe(true);
    expect(functionsAvailable.validateDirectoryTreeStrict).toBe(true);
    expect(functionsAvailable.createDirTree).toBe(true);
    
    await teardownTest(page);
  });
});