import { test, expect } from '@playwright/test';
import { setupTest, teardownTest, DirnavTestHelper } from './test-setup';

test.describe('DirnavUI component', () => {
  let helper: DirnavTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = await setupTest(page);
  });

  test.afterEach(async ({ page }) => {
    await teardownTest(page);
  });

  test('should show and hide the component with Ctrl+`', async ({ page }) => {
    // Component should be visible initially (default behavior)
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
    
    // Hide component
    await helper.hideDirnav();
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(false);
    
    // Show component again
    await helper.showDirnav();
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
  });

  test('should open and close the command palette', async ({ page }) => {
    // Component is visible by default, open command palette
    await helper.openCommandPalette();
    expect(await helper.existsInShadow('input[placeholder="Search..."]')).toBe(true);
    
    // Close command palette with Escape
    await page.keyboard.press('Escape');
    await helper.waitForShadowElementHidden('input[placeholder="Search..."]');
    expect(await helper.existsInShadow('input[placeholder="Search..."]')).toBe(false);
  });

  test('should navigate into a directory and back', async ({ page }) => {
    // Component is visible by default, wait for main navigation to load
    await helper.waitForShadowElement('#main-nav-list');
    
    // Wait for the first navigation item (home directory) to be available
    await helper.waitForShadowElement('#main-nav-item-0');
    
    // Click on the home directory button
    await helper.clickInShadow('#main-nav-item-0 button');
    
    // Wait for navigation to complete and breadcrumbs to update
    await page.waitForTimeout(100);
    await helper.waitForShadowElement('#breadcrumbs');
    
    // Check if we navigated (breadcrumbs should show path)
    const breadcrumbText = await helper.getTextInShadow('#breadcrumbs');
    expect(breadcrumbText).toContain('home');
    
    // Navigate back using the back button
    await helper.clickInShadow('#back-button');
    
    // Wait for navigation back to complete
    await page.waitForTimeout(100);
    
    // Should be back at root
    const titleText = await helper.getTextInShadow('#window-title');
    expect(titleText).toBe('~');
  });

  test('should handle input nodes', async ({ page }) => {
    // Component is visible by default, wait for main navigation to load
    await helper.waitForShadowElement('#main-nav-list');
    
    // Navigate to home directory first
    await helper.waitForShadowElement('#main-nav-item-0');
    await helper.clickInShadow('#main-nav-item-0 button'); // Click home
    
    // Wait for navigation to complete
    await page.waitForTimeout(100);
    await helper.waitForShadowElement('#main-nav-list');
    
    // Find and click on settings input node (should be item 2 in home directory)
    await helper.waitForShadowElement('#main-nav-item-2');
    await helper.clickInShadow('#main-nav-item-2 button');
    
    // Wait for input mode to activate
    await page.waitForTimeout(100);
    await helper.waitForShadowElement('#input-mode-input');
    
    // Focus the input and type using Playwright's native typing
    await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const input = shadowRoot?.querySelector('#input-mode-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    });
    
    // Use Playwright's native typing which should properly trigger events
    await page.keyboard.type('test value');
    
    // Save the input using the save button
    await helper.clickInShadow('#input-mode-save-button');
    
    // Wait for save to complete
    await page.waitForTimeout(100);
    
    // Check localStorage
    const localStorageValue = await page.evaluate(() => localStorage.getItem('dirnav-settings-input'));
    expect(localStorageValue).toBe('test value');
  });

  test('should handle virtual directories', async ({ page }) => {
    // Component is visible by default, wait for main navigation to load
    await helper.waitForShadowElement('#main-nav-list');
    
    // Navigate to home directory first
    await helper.waitForShadowElement('#main-nav-item-0');
    await helper.clickInShadow('#main-nav-item-0 button'); // Click home
    
    // Wait for navigation to complete
    await page.waitForTimeout(100);
    await helper.waitForShadowElement('#main-nav-list');
    
    // Find and click on virtual directory (should be item 4 in home directory)
    await helper.waitForShadowElement('#main-nav-item-4');
    await helper.clickInShadow('#main-nav-item-4 button');
    
    // Should show loading state
    await helper.waitForShadowElement('text=Loading virtual directory...');
    
    // Wait for content to load (virtual directories have a 1 second delay)
    await helper.waitForShadowElement('text=fetched_item1', 5000);
    expect(await helper.existsInShadow('text=fetched_item1')).toBe(true);
  });

  test('should filter results in the command palette', async ({ page }) => {
    // Component is visible by default, open command palette
    await helper.openCommandPalette();
    
    // Wait for command palette input to be ready
    await helper.waitForShadowElement('input[placeholder="Search..."]');
    
    // Focus the search input and type using Playwright's native typing
    await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const input = shadowRoot?.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    });
    
    // Use Playwright's native typing
    await page.keyboard.type('about');
    
    // Wait for search results to appear
    await page.waitForTimeout(200);
    
    // Should show filtered results
    expect(await helper.existsInShadow('text=about')).toBe(true);
  });

  test('should handle keyboard shortcuts for navigation', async ({ page }) => {
    // Focus the window first to ensure keyboard events are handled
    await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const window = shadowRoot?.querySelector('#dirnav-window') as HTMLElement;
      if (window) {
        window.focus();
      }
    });
    
    // Component is visible by default, press number key to select first item
    await page.keyboard.press('1');
    
    // Should navigate to first item (home directory)
    await helper.waitForShadowElement('#breadcrumbs');
    const breadcrumbText = await helper.getTextInShadow('#breadcrumbs');
    expect(breadcrumbText).toContain('home');
    
    // Press backspace to go back
    await page.keyboard.press('Backspace');
    
    // Should be back at root
    const titleText = await helper.getTextInShadow('#window-title');
    expect(titleText).toBe('~');
  });
});
