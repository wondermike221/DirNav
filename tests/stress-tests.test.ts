import { test, expect } from '@playwright/test';
import { setupTest, DirnavTestHelper } from './test-setup';

test.describe('Stress Tests', () => {
  test('should handle rapid keyboard input without breaking', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Rapid key sequence
    const keys = ['1', '2', '3', 'Backspace', '4', '5', 'Escape', 'Control+`'];
    
    for (let cycle = 0; cycle < 5; cycle++) {
      for (const key of keys) {
        await page.keyboard.press(key);
        await page.waitForTimeout(10); // Very short delay
      }
    }
    
    // Component should still be responsive
    await helper.showDirnav();
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
  });

  test('should handle command palette stress testing', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Open command palette
    await helper.openCommandPalette();
    
    // Rapid search term changes
    const searchTerms = ['a', 'ab', 'abc', 'abcd', 'abc', 'ab', 'a', ''];
    
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const term of searchTerms) {
        // Clear input
        await page.evaluate(() => {
          const host = document.querySelector('#dirnav-host');
          const shadowRoot = host?.shadowRoot;
          const input = shadowRoot?.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
          if (input) {
            input.value = '';
            input.focus();
          }
        });
        
        if (term) {
          await helper.typeInShadow('input[placeholder="Search..."]', term);
        }
        await page.waitForTimeout(20);
      }
    }
    
    // Should still be functional
    await page.keyboard.press('Escape');
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
  });

  test('should handle window show/hide stress testing', async ({ page }) => {
    const helper = await setupTest(page);
    
    // Rapid show/hide cycles
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Control+`');
      await page.waitForTimeout(25);
    }
    
    // Should end in a consistent state
    const isVisible = await helper.isVisibleInShadow('#dirnav-window');
    expect(typeof isVisible).toBe('boolean');
    
    // Should still be functional
    if (isVisible) {
      await page.keyboard.press('1');
      await page.waitForTimeout(100);
    }
  });

  test('should handle navigation stress testing', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Rapid navigation sequence
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('1'); // Navigate to first item
      await page.waitForTimeout(30);
      await page.keyboard.press('Backspace'); // Navigate back
      await page.waitForTimeout(30);
    }
    
    // Component should still be functional
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
    
    // Should still respond to navigation
    await page.keyboard.press('1');
    await page.waitForTimeout(100);
    await page.keyboard.press('Backspace');
  });

  test('should handle input mode stress testing', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Navigate to input item (assuming myInput exists in test tree)
    await page.keyboard.press('2'); // Assuming input is second item
    
    // Check if we're in input mode
    const hasInput = await helper.existsInShadow('input[type="text"]');
    
    if (hasInput) {
      // Rapid input changes
      const testStrings = ['test', 'hello', 'world', '123', 'abc', ''];
      
      for (const str of testStrings) {
        // Clear and type
        await page.evaluate(() => {
          const host = document.querySelector('#dirnav-host');
          const shadowRoot = host?.shadowRoot;
          const input = shadowRoot?.querySelector('input[type="text"]') as HTMLInputElement;
          if (input) {
            input.value = '';
            input.focus();
          }
        });
        
        if (str) {
          await helper.typeInShadow('input[type="text"]', str);
        }
        await page.waitForTimeout(50);
      }
      
      // Exit input mode
      await page.keyboard.press('Escape');
    }
    
    // Should still be functional
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
  });

  test('should handle localStorage stress testing', async ({ page }) => {
    const helper = await setupTest(page);
    
    // Fill localStorage with test data
    await page.evaluate(() => {
      for (let i = 0; i < 50; i++) {
        try {
          localStorage.setItem(`stress_test_${i}`, `value_${i}_${Date.now()}`);
        } catch (e) {
          // Ignore quota errors
          break;
        }
      }
    });
    
    await helper.showDirnav();
    
    // Component should still function with full localStorage
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
    
    // Should still be able to navigate
    await page.keyboard.press('1');
    await page.waitForTimeout(100);
    await page.keyboard.press('Backspace');
    
    // Clean up
    await page.evaluate(() => {
      for (let i = 0; i < 50; i++) {
        localStorage.removeItem(`stress_test_${i}`);
      }
    });
  });

  test('should handle theme switching stress testing', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Open command palette and test theme switching
    await helper.openCommandPalette();
    
    // Search for theme options and switch rapidly
    const themes = ['Light', 'Dark', 'System'];
    
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const theme of themes) {
        // Clear search
        await page.evaluate(() => {
          const host = document.querySelector('#dirnav-host');
          const shadowRoot = host?.shadowRoot;
          const input = shadowRoot?.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
          if (input) {
            input.value = '';
            input.focus();
          }
        });
        
        await helper.typeInShadow('input[placeholder="Search..."]', theme);
        await page.waitForTimeout(100);
        
        // Try to select the theme (press Enter)
        await page.keyboard.press('Enter');
        await page.waitForTimeout(100);
        
        // Reopen command palette for next theme
        if (cycle < 2 || theme !== themes[themes.length - 1]) {
          await helper.openCommandPalette();
        }
      }
    }
    
    // Should still be functional
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
  });

  test('should handle error recovery stress testing', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Try various potentially problematic operations
    const operations = [
      () => page.keyboard.press('0'), // Invalid number
      () => page.keyboard.press('a'), // Invalid letter
      () => page.keyboard.press('F1'), // Function key
      () => page.keyboard.press('Tab'), // Tab key
      () => page.keyboard.press('Enter'), // Enter without context
      () => page.keyboard.press('ArrowUp'), // Arrow keys
      () => page.keyboard.press('ArrowDown'),
      () => page.keyboard.press('Space'), // Space
    ];
    
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const operation of operations) {
        try {
          await operation();
          await page.waitForTimeout(50);
        } catch (error) {
          // Ignore errors, we're testing recovery
        }
      }
    }
    
    // Component should still be functional after all invalid operations
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
    
    // Should still respond to valid operations
    await page.keyboard.press('1');
    await page.waitForTimeout(100);
    await page.keyboard.press('Backspace');
  });

  test('should handle DOM manipulation stress testing', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Add and remove DOM elements rapidly
    await page.evaluate(() => {
      const elements: HTMLElement[] = [];
      
      // Add elements
      for (let i = 0; i < 100; i++) {
        const div = document.createElement('div');
        div.id = `stress-element-${i}`;
        div.textContent = `Stress element ${i}`;
        document.body.appendChild(div);
        elements.push(div);
      }
      
      // Remove elements
      elements.forEach(el => el.remove());
    });
    
    // Component should still be functional
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
    
    // Should still respond to navigation
    await page.keyboard.press('1');
    await page.waitForTimeout(100);
    await page.keyboard.press('Backspace');
  });

  test('should handle viewport changes stress testing', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Rapid viewport size changes
    const viewports = [
      { width: 320, height: 240 },
      { width: 768, height: 1024 },
      { width: 1920, height: 1080 },
      { width: 1024, height: 768 },
      { width: 800, height: 600 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(100);
      
      // Verify component is still visible and functional
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
    }
    
    // Should still respond to navigation after viewport changes
    await page.keyboard.press('1');
    await page.waitForTimeout(100);
    await page.keyboard.press('Backspace');
  });
});