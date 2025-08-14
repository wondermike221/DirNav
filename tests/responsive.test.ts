import { test, expect } from '@playwright/test';
import { DirnavTestHelper } from './test-setup';

test.describe('Responsive Design', () => {
  test('should adapt window size for mobile viewport', async ({ page }) => {
    // Set mobile viewport before component initialization
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    const helper = await DirnavTestHelper.create(page);
    await helper.showDirnav();
    
    const windowSize = await helper.getWindowSize();
    const viewportSize = page.viewportSize()!;
    
    // On mobile, window should take up most of the screen
    expect(windowSize.width).toBeGreaterThan(viewportSize.width * 0.8);
    expect(windowSize.height).toBeGreaterThan(viewportSize.height * 0.6);
    expect(windowSize.width).toBeLessThan(viewportSize.width * 0.98);
    expect(windowSize.height).toBeLessThan(viewportSize.height * 0.9);
  });

  test('should adapt window size for tablet viewport', async ({ page }) => {
    // Set tablet viewport before component initialization
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    
    const helper = await DirnavTestHelper.create(page);
    await helper.showDirnav();
    
    const windowSize = await helper.getWindowSize();
    const viewportSize = page.viewportSize()!;
    
    // On tablet, window should be moderately sized
    expect(windowSize.width).toBeGreaterThan(viewportSize.width * 0.4);
    expect(windowSize.height).toBeGreaterThan(viewportSize.height * 0.4);
    expect(windowSize.width).toBeLessThan(viewportSize.width * 0.7);
    expect(windowSize.height).toBeLessThan(viewportSize.height * 0.7);
  });

  test('should adapt window size for desktop viewport', async ({ page }) => {
    // Set desktop viewport before component initialization
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const helper = await DirnavTestHelper.create(page);
    await helper.showDirnav();
    
    const windowSize = await helper.getWindowSize();
    const viewportSize = page.viewportSize()!;
    
    // On desktop, window should be smaller relative to screen
    expect(windowSize.width).toBeGreaterThan(viewportSize.width * 0.2);
    expect(windowSize.height).toBeGreaterThan(viewportSize.height * 0.2);
    expect(windowSize.width).toBeLessThan(viewportSize.width * 0.4);
    expect(windowSize.height).toBeLessThan(viewportSize.height * 0.4);
  });

  test('should have appropriate touch targets on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    const helper = await DirnavTestHelper.create(page);
    await helper.showDirnav();
    
    // Check command palette button (should exist at root level)
    const commandPaletteButton = await helper.getShadowElement('#command-palette-button');
    const commandPaletteButtonSize = await commandPaletteButton.boundingBox();
    expect(commandPaletteButtonSize!.height).toBeGreaterThanOrEqual(40);
    expect(commandPaletteButtonSize!.width).toBeGreaterThanOrEqual(40);
    
    const closeButton = await helper.getShadowElement('#close-button');
    const closeButtonSize = await closeButton.boundingBox();
    expect(closeButtonSize!.height).toBeGreaterThanOrEqual(40);
    expect(closeButtonSize!.width).toBeGreaterThanOrEqual(40);
    
    // Check navigation items have appropriate touch targets
    const navItems = await helper.getShadowElements('.main-nav-item button');
    for (let i = 0; i < Math.min(navItems.length, 3); i++) {
      const itemSize = await navItems[i].boundingBox();
      expect(itemSize!.height).toBeGreaterThanOrEqual(40); // Allow some tolerance for test environment
    }
  });

  test('should handle window resize gracefully', async ({ page }) => {
    const helper = await DirnavTestHelper.create(page);
    await helper.showDirnav();
    
    // Start with desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(100);
    
    const initialSize = await helper.getWindowSize();
    const initialPosition = await helper.getWindowPosition();
    
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(200); // Allow time for resize handling
    
    const newSize = await helper.getWindowSize();
    const newPosition = await helper.getWindowPosition();
    const viewportSize = page.viewportSize()!;
    
    // Window should stay within reasonable bounds (allowing some tolerance for the resize handler)
    expect(newPosition.x).toBeGreaterThanOrEqual(0);
    expect(newPosition.y).toBeGreaterThanOrEqual(0);
    // Allow some tolerance since the resize handler may not be perfect in test environment
    expect(newPosition.x).toBeLessThan(viewportSize.width);
    expect(newPosition.y).toBeLessThan(viewportSize.height - 50); // Keep title bar visible
    
    // Window size should be reasonable for mobile
    expect(newSize.width).toBeLessThanOrEqual(viewportSize.width * 0.95);
    expect(newSize.height).toBeLessThanOrEqual(viewportSize.height * 0.9);
  });

  test('should maintain functionality in landscape orientation on mobile', async ({ page }) => {
    // Set mobile landscape viewport
    await page.setViewportSize({ width: 667, height: 375 });
    
    const helper = await DirnavTestHelper.create(page);
    await helper.showDirnav();
    
    // Window should adapt to landscape
    const windowSize = await helper.getWindowSize();
    const viewportSize = page.viewportSize()!;
    
    expect(windowSize.width).toBeGreaterThan(viewportSize.width * 0.5);
    expect(windowSize.height).toBeGreaterThan(viewportSize.height * 0.6);
    expect(windowSize.width).toBeLessThan(viewportSize.width * 0.9);
    expect(windowSize.height).toBeLessThan(viewportSize.height * 0.95);
    
    // Navigation should still work
    await helper.clickInShadow('.main-nav-item button');
    await page.waitForTimeout(100);
    
    // Should be able to navigate back
    await helper.clickInShadow('#back-button');
    await page.waitForTimeout(100);
  });

  test('should handle portrait orientation on mobile', async ({ page }) => {
    // Set mobile portrait viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const helper = await DirnavTestHelper.create(page);
    await helper.showDirnav();
    
    // Window should adapt to portrait
    const windowSize = await helper.getWindowSize();
    const viewportSize = page.viewportSize()!;
    
    expect(windowSize.width).toBeGreaterThan(viewportSize.width * 0.8);
    expect(windowSize.height).toBeGreaterThan(viewportSize.height * 0.4);
    expect(windowSize.width).toBeLessThan(viewportSize.width * 0.98);
    expect(windowSize.height).toBeLessThan(viewportSize.height * 0.85);
  });

  test('should constrain dragging within viewport bounds', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    
    const helper = await DirnavTestHelper.create(page);
    await helper.showDirnav();
    
    // Try to drag window outside viewport bounds
    const titleBar = await helper.getShadowElement('.title-bar');
    const titleBarBox = await titleBar.boundingBox();
    
    // Drag far to the right and down
    await page.mouse.move(titleBarBox!.x + titleBarBox!.width / 2, titleBarBox!.y + titleBarBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(1500, 1000); // Way outside viewport
    await page.mouse.up();
    
    await page.waitForTimeout(100);
    
    const position = await helper.getWindowPosition();
    const windowSize = await helper.getWindowSize();
    const viewportSize = page.viewportSize()!;
    
    // Window should be constrained within viewport
    expect(position.x).toBeGreaterThanOrEqual(0);
    expect(position.y).toBeGreaterThanOrEqual(0);
    expect(position.x).toBeLessThanOrEqual(viewportSize.width - 100); // Keep some window visible
    expect(position.y).toBeLessThanOrEqual(viewportSize.height - 50); // Keep title bar visible
  });

  test('should constrain resizing within reasonable bounds', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    
    const helper = await DirnavTestHelper.create(page);
    await helper.showDirnav();
    
    // Try to resize to extreme sizes
    const resizeHandle = await helper.getShadowElement('#resize-handle');
    const resizeBox = await resizeHandle.boundingBox();
    
    // Try to resize very large
    await page.mouse.move(resizeBox!.x + resizeBox!.width / 2, resizeBox!.y + resizeBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(1500, 1000); // Way outside viewport
    await page.mouse.up();
    
    await page.waitForTimeout(100);
    
    const largeSize = await helper.getWindowSize();
    const viewportSize = page.viewportSize()!;
    
    // Size should be constrained
    expect(largeSize.width).toBeLessThanOrEqual(viewportSize.width * 0.95);
    expect(largeSize.height).toBeLessThanOrEqual(viewportSize.height * 0.9);
    
    // Try to resize very small
    await page.mouse.move(resizeBox!.x + resizeBox!.width / 2, resizeBox!.y + resizeBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(100, 100); // Very small
    await page.mouse.up();
    
    await page.waitForTimeout(100);
    
    const smallSize = await helper.getWindowSize();
    
    // Size should have minimum bounds
    expect(smallSize.width).toBeGreaterThan(150); // Reasonable minimum
    expect(smallSize.height).toBeGreaterThan(100); // Reasonable minimum
  });

  test('should reset to appropriate size for current viewport', async ({ page }) => {
    const helper = await DirnavTestHelper.create(page);
    await helper.showDirnav();
    
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await helper.clickInShadow('#resize-button');
    await page.waitForTimeout(100);
    
    let windowSize = await helper.getWindowSize();
    let viewportSize = page.viewportSize()!;
    
    // Should reset to mobile-appropriate size
    expect(windowSize.width).toBeGreaterThan(viewportSize.width * 0.8);
    expect(windowSize.height).toBeGreaterThan(viewportSize.height * 0.6);
    
    // Test on desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await helper.clickInShadow('#resize-button');
    await page.waitForTimeout(100);
    
    windowSize = await helper.getWindowSize();
    viewportSize = page.viewportSize()!;
    
    // Should reset to desktop-appropriate size
    expect(windowSize.width).toBeCloseTo(viewportSize.width * 0.25, -1);
    expect(windowSize.height).toBeCloseTo(viewportSize.height * 0.25, -1);
  });

  test('should handle command palette responsively', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    
    const helper = await DirnavTestHelper.create(page);
    await helper.showDirnav();
    
    // Open command palette using the helper method
    await helper.openCommandPalette();
    
    // Input should be appropriately sized for mobile
    const input = await helper.getShadowElement('#command-palette-input');
    const inputBox = await input.boundingBox();
    
    expect(inputBox!.height).toBeGreaterThanOrEqual(40); // Touch-friendly height (allow some tolerance)
    
    // Type to get results
    await input.fill('test');
    await page.waitForTimeout(100);
    
    // Results should be touch-friendly
    const results = await helper.getShadowElements('.command-palette-result');
    if (results.length > 0) {
      const resultBox = await results[0].boundingBox();
      expect(resultBox!.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('should maintain accessibility on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1920, height: 1080 }  // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      const helper = await DirnavTestHelper.create(page);
      await helper.showDirnav();
      
      // Check that focus indicators are visible
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => {
        const host = document.querySelector('#dirnav-host');
        const shadowRoot = host?.shadowRoot;
        return shadowRoot?.activeElement?.tagName;
      });
      
      expect(focusedElement).toBeTruthy();
      
      // Check that keyboard navigation works
      await page.keyboard.press('1');
      await page.waitForTimeout(100);
      
      // Should be able to navigate back
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(100);
      
      await helper.hideDirnav();
    }
  });
});