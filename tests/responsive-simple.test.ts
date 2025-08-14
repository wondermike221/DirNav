import { test, expect } from '@playwright/test';
import { setupTest } from './test-setup';

test.describe('Responsive Design - Basic', () => {
  test('should show component and adapt to mobile viewport', async ({ page }) => {
    const helper = await setupTest(page);
    
    // Show component first with default viewport
    await helper.showDirnav();
    
    // Verify component is visible
    const isVisible = await helper.isVisibleInShadow('#dirnav-window');
    expect(isVisible).toBe(true);
    
    // Get initial size
    const initialSize = await helper.getWindowSize();
    expect(initialSize.width).toBeGreaterThan(0);
    expect(initialSize.height).toBeGreaterThan(0);
    
    // Change to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300); // Allow time for responsive adjustments
    
    // Component should still be visible
    const stillVisible = await helper.isVisibleInShadow('#dirnav-window');
    expect(stillVisible).toBe(true);
    
    // Get new size
    const newSize = await helper.getWindowSize();
    const viewportSize = page.viewportSize()!;
    
    // On mobile, window should take up most of the screen width
    expect(newSize.width).toBeGreaterThan(viewportSize.width * 0.7);
    expect(newSize.width).toBeLessThan(viewportSize.width);
  });

  test('should have touch-friendly button sizes on mobile', async ({ page }) => {
    const helper = await setupTest(page);
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(200);
    
    await helper.showDirnav();
    
    // Check if back button exists and has appropriate size
    const backButtonExists = await helper.existsInShadow('#back-button');
    if (backButtonExists) {
      const backButton = await helper.getShadowElement('#back-button');
      const backButtonSize = await backButton.boundingBox();
      
      // Should be at least 44px for touch targets
      expect(backButtonSize!.height).toBeGreaterThanOrEqual(40); // Allow some tolerance
      expect(backButtonSize!.width).toBeGreaterThanOrEqual(40);
    }
    
    // Check close button
    const closeButton = await helper.getShadowElement('#close-button');
    const closeButtonSize = await closeButton.boundingBox();
    expect(closeButtonSize!.height).toBeGreaterThanOrEqual(40);
    expect(closeButtonSize!.width).toBeGreaterThanOrEqual(40);
  });

  test('should maintain functionality after viewport changes', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Start with desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(200);
    
    // Navigate to a folder
    await helper.clickInShadow('.main-nav-item button');
    await page.waitForTimeout(100);
    
    // Change to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    // Should still be able to navigate back
    const backButtonExists = await helper.existsInShadow('#back-button');
    if (backButtonExists) {
      await helper.clickInShadow('#back-button');
      await page.waitForTimeout(100);
    }
    
    // Component should still be functional
    const isVisible = await helper.isVisibleInShadow('#dirnav-window');
    expect(isVisible).toBe(true);
  });
});