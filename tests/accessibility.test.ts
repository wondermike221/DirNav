import { test, expect } from '@playwright/test';
import { setupTest } from './test-setup';

test.describe('Accessibility Enhancements', () => {
  test('should have proper ARIA labels and roles on window', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Check main window has proper role and labels
    const hasRole = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const window = shadowRoot?.querySelector('#dirnav-window');
      return window?.getAttribute('role') === 'dialog';
    });
    expect(hasRole).toBe(true);
    
    const hasAriaLabel = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const window = shadowRoot?.querySelector('#dirnav-window');
      return window?.getAttribute('aria-label') === 'Directory Navigation Window';
    });
    expect(hasAriaLabel).toBe(true);
  });

  test('should have proper ARIA labels on title bar elements', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Check title bar has proper role
    const titleBarRole = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const titleBar = shadowRoot?.querySelector('.title-bar');
      return titleBar?.getAttribute('role') === 'banner';
    });
    expect(titleBarRole).toBe(true);
    
    // Check title has proper heading role
    const titleRole = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const title = shadowRoot?.querySelector('#window-title');
      return title?.getAttribute('role') === 'heading' && title?.getAttribute('aria-level') === '1';
    });
    expect(titleRole).toBe(true);
  });

  test('should have proper breadcrumb navigation structure', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Check breadcrumbs have proper navigation role
    const breadcrumbsRole = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const breadcrumbs = shadowRoot?.querySelector('#breadcrumbs');
      return breadcrumbs?.getAttribute('aria-label') === 'Directory breadcrumb navigation';
    });
    expect(breadcrumbsRole).toBe(true);
    
    // Check breadcrumb list structure
    const breadcrumbListRole = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const breadcrumbList = shadowRoot?.querySelector('.breadcrumb-list');
      return breadcrumbList?.getAttribute('role') === 'list';
    });
    expect(breadcrumbListRole).toBe(true);
  });

  test('should have proper main navigation structure', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Check main navigation has proper region role
    const mainNavRegion = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const region = shadowRoot?.querySelector('[role="region"][aria-label="Directory contents"]');
      return !!region;
    });
    expect(mainNavRegion).toBe(true);
    
    // Check navigation list
    const navListRole = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const navList = shadowRoot?.querySelector('#main-nav-list');
      return navList?.getAttribute('role') === 'list' && navList?.getAttribute('aria-label') === 'Directory items';
    });
    expect(navListRole).toBe(true);
  });

  test('should have keyboard shortcut indicators', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Check that keyboard shortcut indicators are present
    const hasShortcutIndicators = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const indicators = shadowRoot?.querySelectorAll('.keyboard-shortcut-indicator');
      return indicators && indicators.length > 0;
    });
    expect(hasShortcutIndicators).toBe(true);
  });

  test('should have proper command palette accessibility', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Open command palette
    await helper.openCommandPalette();
    
    // Check command palette structure
    const commandPaletteRole = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const commandPalette = shadowRoot?.querySelector('#command-palette');
      return commandPalette?.getAttribute('role') === 'search' && 
             commandPalette?.getAttribute('aria-label') === 'Command palette search';
    });
    expect(commandPaletteRole).toBe(true);
    
    // Check input field
    const inputRole = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const input = shadowRoot?.querySelector('#command-palette-input');
      return input?.getAttribute('role') === 'combobox' && 
             input?.getAttribute('aria-autocomplete') === 'list';
    });
    expect(inputRole).toBe(true);
  });

  test('should have screen reader only content', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Open command palette to reveal sr-only elements
    await helper.openCommandPalette();
    
    // Check that sr-only elements exist in command palette
    const hasSrOnlyElements = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const srOnlyElements = shadowRoot?.querySelectorAll('.sr-only');
      return srOnlyElements && srOnlyElements.length > 0;
    });
    expect(hasSrOnlyElements).toBe(true);
  });

  test('should support high contrast mode', async ({ page }) => {
    const helper = await setupTest(page);
    
    // Emulate high contrast preference
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    
    await helper.showDirnav();
    
    // Verify the component still renders properly
    const isVisible = await helper.isVisibleInShadow('#dirnav-window');
    expect(isVisible).toBe(true);
  });
});