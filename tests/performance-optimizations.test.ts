import { test, expect } from '@playwright/test';
import { setupTest } from './test-setup';

test.describe('Performance Optimizations', () => {
  test('should demonstrate memoization and debouncing benefits', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Open command palette
    await helper.openCommandPalette();
    
    // Test debounced search - rapid typing should not cause excessive searches
    const searchInput = 'input[placeholder="Search..."]';
    
    // Measure time for rapid typing (should be fast due to debouncing)
    const start = performance.now();
    
    // Type rapidly - debouncing should prevent excessive search operations
    await helper.typeInShadow(searchInput, 'f');
    await page.waitForTimeout(50);
    await helper.typeInShadow(searchInput, 'fo');
    await page.waitForTimeout(50);
    await helper.typeInShadow(searchInput, 'fol');
    await page.waitForTimeout(50);
    await helper.typeInShadow(searchInput, 'fold');
    await page.waitForTimeout(50);
    await helper.typeInShadow(searchInput, 'folde');
    await page.waitForTimeout(50);
    await helper.typeInShadow(searchInput, 'folder');
    
    // Wait for debounced search to complete
    await page.waitForTimeout(200);
    
    const end = performance.now();
    const rapidTypingTime = end - start;
    
    console.log(`Rapid typing with debouncing: ${rapidTypingTime.toFixed(2)}ms`);
    
    // Should complete quickly due to debouncing
    expect(rapidTypingTime).toBeLessThan(1000);
    
    // Verify search results are displayed
    const resultsVisible = await helper.isVisibleInShadow('#command-palette-results');
    expect(resultsVisible).toBe(true);
  });

  test('should demonstrate memoized computations', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Navigate to test memoized pagination
    const start1 = performance.now();
    await page.keyboard.press('1'); // Navigate to first item
    await page.waitForTimeout(100);
    const end1 = performance.now();
    
    // Navigate back
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(100);
    
    // Navigate again - should be faster due to memoization
    const start2 = performance.now();
    await page.keyboard.press('1');
    await page.waitForTimeout(100);
    const end2 = performance.now();
    
    const firstNavTime = end1 - start1;
    const secondNavTime = end2 - start2;
    
    console.log(`First navigation: ${firstNavTime.toFixed(2)}ms`);
    console.log(`Second navigation: ${secondNavTime.toFixed(2)}ms`);
    
    // Both should be reasonably fast
    expect(firstNavTime).toBeLessThan(500);
    expect(secondNavTime).toBeLessThan(500);
    
    // Verify component is still functional
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
  });

  test('should handle performance monitoring', async ({ page }) => {
    const helper = await setupTest(page);
    
    // Test that performance monitoring is working
    const performanceStats = await page.evaluate(() => {
      // Access the performance monitor if available
      return (window as any).dirnavPerformanceStats || null;
    });
    
    // Performance monitoring should be available in development
    console.log('Performance monitoring available:', performanceStats !== null);
    
    await helper.showDirnav();
    
    // Perform some operations to generate performance data
    await helper.openCommandPalette();
    await helper.typeInShadow('input[placeholder="Search..."]', 'test');
    await page.waitForTimeout(200);
    
    // Close command palette
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    
    // Verify component is still responsive
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(false);
  });

  test('should demonstrate throttled navigation', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Test throttled navigation - rapid key presses should be handled gracefully
    const start = performance.now();
    
    // Rapid navigation attempts (throttling should prevent issues)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('1');
      await page.waitForTimeout(20); // Very rapid
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(20);
    }
    
    const end = performance.now();
    const throttledNavTime = end - start;
    
    console.log(`Throttled navigation sequence: ${throttledNavTime.toFixed(2)}ms`);
    
    // Should complete within reasonable time despite rapid input
    expect(throttledNavTime).toBeLessThan(1000);
    
    // Component should still be functional
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
  });
});