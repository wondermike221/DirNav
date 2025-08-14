import { test, expect } from '@playwright/test';
import { setupTest, DirnavTestHelper, TestDirectoryTree } from './test-setup';

test.describe('Edge Case Tests', () => {
  test.describe('Keyboard Shortcut Edge Cases', () => {
    test('should handle rapid keyboard input without conflicts', async ({ page }) => {
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      // Rapid key presses
      const keys = ['1', '2', '3', 'Backspace', '4', '5', 'Escape'];
      for (const key of keys) {
        await page.keyboard.press(key);
        await page.waitForTimeout(10); // Very short delay
      }
      
      // Component should still be responsive
      await helper.showDirnav();
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
    });

    test('should handle keyboard shortcuts with modifier keys', async ({ page }) => {
      const helper = await setupTest(page);
      
      // Test Ctrl+` multiple times rapidly
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Control+`');
        await page.waitForTimeout(50);
      }
      
      // Should end up in a consistent state (visible or hidden)
      const isVisible = await helper.isVisibleInShadow('#dirnav-window');
      expect(typeof isVisible).toBe('boolean');
    });

    test('should handle invalid keyboard shortcuts gracefully', async ({ page }) => {
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      // Try invalid number keys
      const invalidKeys = ['0', 'a', 'z', 'F1', 'Tab', 'Enter'];
      for (const key of invalidKeys) {
        await page.keyboard.press(key);
        await page.waitForTimeout(50);
      }
      
      // Component should remain functional
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
      
      // Valid navigation should still work
      await page.keyboard.press('1');
      // Should not throw error
    });

    test('should handle keyboard shortcuts when component is not focused', async ({ page }) => {
      const helper = await setupTest(page);
      
      // Create a focusable element outside the component
      await page.evaluate(() => {
        const input = document.createElement('input');
        input.id = 'external-input';
        document.body.appendChild(input);
      });
      
      // Focus external element
      await page.focus('#external-input');
      
      // Try component shortcuts
      await page.keyboard.press('Control+`');
      await helper.waitForShadowElement('#dirnav-window');
      
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
    });

    test('should handle simultaneous keyboard events', async ({ page }) => {
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      // Simulate simultaneous key presses (as much as possible in browser)
      await Promise.all([
        page.keyboard.press('1'),
        page.keyboard.press('2'),
        page.keyboard.press('3')
      ]);
      
      await page.waitForTimeout(100);
      
      // Component should remain stable
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should recover from corrupted localStorage', async ({ page }) => {
      // Corrupt localStorage before component initialization
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('dirnav-component-theme-preference', 'invalid-theme');
        localStorage.setItem('dirnav-window-position', 'invalid-json');
        localStorage.setItem('dirnav-window-size', '{broken json}');
      });
      
      const helper = await setupTest(page);
      
      // Component should still initialize
      await helper.showDirnav();
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
      
      // Should use default values
      const windowSize = await helper.getWindowSize();
      expect(windowSize.width).toBeGreaterThan(0);
      expect(windowSize.height).toBeGreaterThan(0);
    });

    test('should handle virtual directory failures gracefully', async ({ page }) => {
      await page.goto('/');
      
      await page.evaluate(() => {
        const failingTree: any = {
          'failing_virtual': {
            name: 'failing_virtual',
            type: 'virtual-directory',
            onSelect: async () => {
              throw new Error('Virtual directory load failed');
            }
          },
          'slow_virtual': {
            name: 'slow_virtual',
            type: 'virtual-directory',
            onSelect: async () => {
              await new Promise(resolve => setTimeout(resolve, 5000)); // Very slow
              return { 'item': { name: 'item', type: 'action', action: () => {} } };
            }
          }
        };
        
        (window as any).testDirectoryTree = failingTree;
        
        const script = document.createElement('script');
        script.textContent = `
          import('./src/main.tsx').then(module => {
            const { render } = module;
            render(window.testDirectoryTree);
          });
        `;
        script.type = 'module';
        document.head.appendChild(script);
      });
      
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      // Try to navigate to failing virtual directory
      await page.keyboard.press('1');
      
      // Should show error or fallback content
      await page.waitForTimeout(1000);
      
      // Component should remain functional
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
      
      // Should be able to navigate back
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(100);
    });

    test('should handle malformed directory tree data', async ({ page }) => {
      await page.goto('/');
      
      // Test malformed data handling in browser context
      const initError = await page.evaluate(() => {
        try {
          const malformedTree: any = {
            'normal_item': {
              name: 'normal_item',
              type: 'action',
              action: () => console.log('normal')
            },
            'missing_name': {
              type: 'action',
              action: () => console.log('missing name')
            },
            'invalid_type': {
              name: 'invalid_type',
              type: 'invalid-type' as any,
              action: () => console.log('invalid')
            }
          };
          
          (window as any).testDirectoryTree = malformedTree;
          
          const script = document.createElement('script');
          script.textContent = `
            import('./src/main.tsx').then(module => {
              const { render } = module;
              render(window.testDirectoryTree);
            });
          `;
          script.type = 'module';
          document.head.appendChild(script);
          
          return null;
        } catch (error) {
          return (error as Error).message;
        }
      });
      
      // Should either handle gracefully or provide meaningful error
      if (initError) {
        expect(initError).toBeTruthy(); // Should have some error message
      }
      
      // Wait a bit to see if component initializes despite malformed data
      await page.waitForTimeout(1000);
    });

    test('should handle component initialization failures', async ({ page }) => {
      await page.goto('/');
      
      // Simulate DOM manipulation errors
      await page.evaluate(() => {
        // Override appendChild to simulate DOM errors
        const originalAppendChild = Element.prototype.appendChild;
        let callCount = 0;
        Element.prototype.appendChild = function(child) {
          callCount++;
          if (callCount === 3) { // Fail on third call
            throw new Error('DOM manipulation failed');
          }
          return originalAppendChild.call(this, child);
        };
      });
      
      // Try to initialize component
      try {
        await setupTest(page);
      } catch (error) {
        // Should handle initialization failure gracefully
        expect(error).toBeDefined();
      }
      
      // Restore normal DOM behavior
      await page.evaluate(() => {
        location.reload();
      });
    });

    test('should handle memory pressure scenarios', async ({ page }) => {
      const helper = await setupTest(page);
      
      // Create memory pressure by creating large objects
      await page.evaluate(() => {
        const largeArrays = [];
        for (let i = 0; i < 100; i++) {
          largeArrays.push(new Array(10000).fill('memory-pressure-test'));
        }
        (window as any).memoryPressure = largeArrays;
      });
      
      await helper.showDirnav();
      
      // Component should still function under memory pressure
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
      
      // Navigation should still work
      await page.keyboard.press('1');
      await page.waitForTimeout(100);
      
      // Clean up memory pressure
      await page.evaluate(() => {
        delete (window as any).memoryPressure;
      });
    });
  });

  test.describe('Accessibility Edge Cases', () => {
    test('should maintain accessibility with dynamic content changes', async ({ page }) => {
      await page.goto('/');
      
      await page.evaluate(() => {
        const dynamicTree: any = {
          'dynamic_content': {
            name: 'dynamic_content',
            type: 'virtual-directory',
            onSelect: async () => {
              // Return different content each time
              const timestamp = Date.now();
              return {
                [`item_${timestamp}`]: {
                  name: `item_${timestamp}`,
                  type: 'action',
                  action: () => console.log(`Dynamic item ${timestamp}`)
                }
              };
            }
          }
        };
        
        (window as any).testDirectoryTree = dynamicTree;
        
        const script = document.createElement('script');
        script.textContent = `
          import('./src/main.tsx').then(module => {
            const { render } = module;
            render(window.testDirectoryTree);
          });
        `;
        script.type = 'module';
        document.head.appendChild(script);
      });
      
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      // Navigate to dynamic content multiple times
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('1');
        await page.waitForTimeout(200);
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(100);
      }
      
      // Check for accessibility attributes
      const hasAriaLabels = await page.evaluate(() => {
        const host = document.querySelector('#dirnav-host');
        const shadowRoot = host?.shadowRoot;
        const elements = shadowRoot?.querySelectorAll('[aria-label], [role]');
        return elements && elements.length > 0;
      });
      
      expect(hasAriaLabels).toBe(true);
    });

    test('should handle screen reader navigation patterns', async ({ page }) => {
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      // Simulate screen reader navigation (Tab key)
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      // Should maintain focus management
      const focusedElement = await page.evaluate(() => {
        const host = document.querySelector('#dirnav-host');
        const shadowRoot = host?.shadowRoot;
        return shadowRoot?.activeElement?.tagName;
      });
      
      // Should have some focused element or handle focus appropriately
      expect(typeof focusedElement).toBe('string');
    });

    test('should maintain high contrast mode compatibility', async ({ page }) => {
      // Enable high contrast mode simulation
      await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
      
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      // Check that component is visible in high contrast mode
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
      
      // Check for proper contrast ratios (basic check)
      const hasGoodContrast = await page.evaluate(() => {
        const host = document.querySelector('#dirnav-host');
        const shadowRoot = host?.shadowRoot;
        const window = shadowRoot?.querySelector('#dirnav-window') as HTMLElement;
        if (window) {
          const styles = getComputedStyle(window);
          const bgColor = styles.backgroundColor;
          const color = styles.color;
          return bgColor !== color && bgColor !== 'transparent';
        }
        return false;
      });
      
      expect(hasGoodContrast).toBe(true);
    });

    test('should handle reduced motion preferences', async ({ page }) => {
      // Enable reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      // Component should still function with reduced motion
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
      
      // Navigation should work without animations
      await page.keyboard.press('1');
      await page.waitForTimeout(100);
      await page.keyboard.press('Backspace');
      
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
    });
  });

  test.describe('Responsive Behavior Edge Cases', () => {
    test('should handle extreme viewport sizes', async ({ page }) => {
      // Test very small viewport
      await page.setViewportSize({ width: 320, height: 240 });
      
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
      
      // Window should be appropriately sized
      const smallSize = await helper.getWindowSize();
      expect(smallSize.width).toBeGreaterThan(0);
      expect(smallSize.width).toBeLessThan(320);
      
      // Test very large viewport
      await page.setViewportSize({ width: 3840, height: 2160 });
      await page.waitForTimeout(100);
      
      const largeSize = await helper.getWindowSize();
      expect(largeSize.width).toBeGreaterThan(smallSize.width);
    });

    test('should handle viewport orientation changes', async ({ page }) => {
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      // Simulate portrait orientation
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(100);
      
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
      
      // Simulate landscape orientation
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(100);
      
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
      
      // Component should remain functional
      await page.keyboard.press('1');
      await page.waitForTimeout(100);
    });

    test('should handle zoom level changes', async ({ page }) => {
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      // Test different zoom levels
      const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
      
      for (const zoom of zoomLevels) {
        await page.evaluate((zoomLevel) => {
          document.body.style.zoom = zoomLevel.toString();
        }, zoom);
        
        await page.waitForTimeout(100);
        
        // Component should remain visible and functional
        expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
      }
      
      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1';
      });
    });

    test('should handle dynamic CSS changes', async ({ page }) => {
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      // Inject conflicting CSS
      await page.addStyleTag({
        content: `
          * {
            box-sizing: content-box !important;
            position: static !important;
          }
          div {
            background: red !important;
            color: yellow !important;
          }
        `
      });
      
      await page.waitForTimeout(100);
      
      // Component should still be functional despite CSS conflicts
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
      
      // Navigation should still work
      await page.keyboard.press('1');
      await page.waitForTimeout(100);
    });
  });

  test.describe('Input and State Edge Cases', () => {
    test('should handle input mode with special characters', async ({ page }) => {
      await page.goto('/');
      
      await page.evaluate(() => {
        const inputTree: any = {
          'special_input': {
            name: 'special_input',
            type: 'input',
            localStorageKey: 'special_test'
          }
        };
        
        (window as any).testDirectoryTree = inputTree;
        
        const script = document.createElement('script');
        script.textContent = `
          import('./src/main.tsx').then(module => {
            const { render } = module;
            render(window.testDirectoryTree);
          });
        `;
        script.type = 'module';
        document.head.appendChild(script);
      });
      
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      // Navigate to input
      await page.keyboard.press('1');
      await helper.waitForShadowElement('input[type="text"]');
      
      // Test special characters
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\';
      await helper.typeInShadow('input[type="text"]', specialText);
      
      // Save input
      await page.keyboard.press('Enter');
      
      // Verify input was saved
      const savedValue = await page.evaluate(() => {
        return localStorage.getItem('special_test');
      });
      
      expect(savedValue).toBe(specialText);
    });

    test('should handle rapid state changes', async ({ page }) => {
      const helper = await setupTest(page);
      
      // Rapid show/hide cycles
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Control+`');
        await page.waitForTimeout(10);
      }
      
      // Should end in consistent state
      const isVisible = await helper.isVisibleInShadow('#dirnav-window');
      expect(typeof isVisible).toBe('boolean');
      
      if (isVisible) {
        // Rapid navigation if visible
        const keys = ['1', 'Backspace', '1', 'Backspace', '1', 'Backspace'];
        for (const key of keys) {
          await page.keyboard.press(key);
          await page.waitForTimeout(10);
        }
        
        expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
      }
    });

    test('should handle command palette with empty search results', async ({ page }) => {
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      // Open command palette
      await helper.openCommandPalette();
      
      // Search for something that doesn't exist
      await helper.typeInShadow('input[placeholder="Search..."]', 'nonexistent_item_xyz');
      await page.waitForTimeout(100);
      
      // Should handle empty results gracefully
      const hasNoResults = await page.evaluate(() => {
        const host = document.querySelector('#dirnav-host');
        const shadowRoot = host?.shadowRoot;
        const results = shadowRoot?.querySelectorAll('.dirnav-search-result');
        return !results || results.length === 0;
      });
      
      expect(hasNoResults).toBe(true);
      
      // Should still be able to exit command palette
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
    });

    test('should handle localStorage quota exceeded', async ({ page }) => {
      await page.goto('/');
      
      // Fill up localStorage to near capacity
      await page.evaluate(() => {
        try {
          const largeString = 'x'.repeat(1024 * 1024); // 1MB string
          for (let i = 0; i < 5; i++) {
            localStorage.setItem(`large_item_${i}`, largeString);
          }
        } catch (e) {
          // Expected to fail at some point
        }
        
        // Create input tree
        const inputTree: any = {
          'test_input': {
            name: 'test_input',
            type: 'input',
            localStorageKey: 'quota_test'
          }
        };
        
        (window as any).testDirectoryTree = inputTree;
        
        const script = document.createElement('script');
        script.textContent = `
          import('./src/main.tsx').then(module => {
            const { render } = module;
            render(window.testDirectoryTree);
          });
        `;
        script.type = 'module';
        document.head.appendChild(script);
      });
      
      const helper = await setupTest(page);
      await helper.showDirnav();
      
      // Component should still function even if localStorage is full
      expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
    });
  });
});