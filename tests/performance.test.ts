import { test, expect } from '@playwright/test';
import { setupTest, DirnavTestHelper, TestDirectoryTree } from './test-setup';

/**
 * Creates a large directory tree structure (without functions) for performance testing
 * @param levels - Number of directory levels
 * @param itemsPerLevel - Number of items per directory level
 * @param includeVirtual - Whether to include virtual directories
 */
function createLargeDirectoryTreeStructure(levels: number, itemsPerLevel: number, includeVirtual: boolean = false): any {
  function createLevel(currentLevel: number, maxLevels: number, prefix: string = ''): any {
    const levelTree: any = {};
    
    for (let i = 0; i < itemsPerLevel; i++) {
      const itemName = `${prefix}item${i}`;
      
      if (currentLevel < maxLevels) {
        // Create directory with children
        levelTree[itemName] = {
          name: itemName,
          type: 'directory',
          children: createLevel(currentLevel + 1, maxLevels, `${prefix}L${currentLevel}_`)
        };
      } else {
        // Create leaf nodes with different types
        const nodeType = i % 4;
        switch (nodeType) {
          case 0:
            levelTree[itemName] = {
              name: itemName,
              type: 'action',
              actionType: 'console.log'
            };
            break;
          case 1:
            levelTree[itemName] = {
              name: itemName,
              type: 'input',
              localStorageKey: `test_${itemName}`
            };
            break;
          case 2:
            if (includeVirtual) {
              levelTree[itemName] = {
                name: itemName,
                type: 'virtual-directory',
                virtualType: 'async'
              };
            } else {
              levelTree[itemName] = {
                name: itemName,
                type: 'action',
                actionType: 'console.log'
              };
            }
            break;
          default:
            levelTree[itemName] = {
              name: itemName,
              type: 'action',
              actionType: 'console.log'
            };
        }
      }
    }
    
    return levelTree;
  }
  
  return createLevel(0, levels);
}

/**
 * Measures performance of a function
 */
async function measurePerformance<T>(fn: () => Promise<T> | T, name: string): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;
  console.log(`${name}: ${duration.toFixed(2)}ms`);
  return { result, duration };
}

test.describe('Performance Tests', () => {
  test('should handle large directory tree (1000+ items) efficiently', async ({ page }) => {
    const helper = await setupTest(page);
    
    // Create a large tree structure in the browser context
    await page.evaluate(() => {
      // Create a large tree: 3 levels with 15 items each = ~3,375 items
      function createLargeTree(levels: number, itemsPerLevel: number): any {
        function createLevel(currentLevel: number, maxLevels: number, prefix: string = ''): any {
          const levelTree: any = {};
          
          for (let i = 0; i < itemsPerLevel; i++) {
            const itemName = `${prefix}item${i}`;
            
            if (currentLevel < maxLevels) {
              // Create directory with children
              levelTree[itemName] = {
                name: itemName,
                type: 'directory',
                children: createLevel(currentLevel + 1, maxLevels, `${prefix}L${currentLevel}_`)
              };
            } else {
              // Create leaf nodes
              levelTree[itemName] = {
                name: itemName,
                type: 'action',
                action: () => console.log(`Action: ${itemName}`)
              };
            }
          }
          
          return levelTree;
        }
        
        return createLevel(0, levels);
      }
      
      // Replace the existing tree with a large one
      const host = document.querySelector('#dirnav-host');
      if (host) {
        host.remove();
      }
      
      // Create new component with large tree
      const largeTree = createLargeTree(3, 15);
      (window as any).testDirectoryTree = largeTree;
      
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
    
    // Wait for component to initialize
    await page.waitForSelector('#dirnav-host');
    
    // Measure initial render time
    const { duration: renderTime } = await measurePerformance(async () => {
      await helper.waitForShadowElement('#dirnav-window');
      return true;
    }, 'Initial render with large tree');
    
    // Should render within reasonable time (< 2000ms for large tree)
    expect(renderTime).toBeLessThan(2000);
    
    // Verify component is functional
    await helper.showDirnav();
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
    
    // Test navigation performance
    const { duration: navTime } = await measurePerformance(async () => {
      // Navigate into first directory
      await page.keyboard.press('1');
      await page.waitForTimeout(200); // Allow navigation to complete
      return true;
    }, 'Navigation to subdirectory');
    
    expect(navTime).toBeLessThan(500);
  });

  test('should handle rapid navigation operations efficiently', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Perform rapid navigation sequence with default tree
    const { duration: rapidNavTime } = await measurePerformance(async () => {
      for (let i = 0; i < 10; i++) {
        // Navigate down to first item
        await page.keyboard.press('1');
        await page.waitForTimeout(50); // Small delay to allow rendering
        
        // Navigate back
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(50);
      }
      return true;
    }, 'Rapid navigation sequence (10 cycles)');
    
    // Should complete rapid navigation within reasonable time
    expect(rapidNavTime).toBeLessThan(2000);
    
    // Verify component is still functional after rapid navigation
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
  });

  test('should handle command palette search efficiently', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Open command palette
    await helper.openCommandPalette();
    
    // Measure search performance with default tree
    const { duration: searchTime } = await measurePerformance(async () => {
      await helper.typeInShadow('input[placeholder="Search..."]', 'folder');
      await page.waitForTimeout(100); // Allow search to complete
      return true;
    }, 'Command palette search');
    
    expect(searchTime).toBeLessThan(500);
    
    // Test rapid search updates
    const { duration: rapidSearchTime } = await measurePerformance(async () => {
      const searchTerms = ['folder', 'input', 'action', 'virtual', 'test'];
      for (const term of searchTerms) {
        // Clear and type new search term
        await page.evaluate(() => {
          const host = document.querySelector('#dirnav-host');
          const shadowRoot = host?.shadowRoot;
          const input = shadowRoot?.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
          if (input) {
            input.value = '';
            input.focus();
          }
        });
        await helper.typeInShadow('input[placeholder="Search..."]', term);
        await page.waitForTimeout(50);
      }
      return true;
    }, 'Rapid search term updates');
    
    expect(rapidSearchTime).toBeLessThan(1000);
  });

  test('should handle virtual directory loading and cleanup efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Create tree with many virtual directories in the browser
    await page.evaluate(() => {
      const virtualTree: any = {};
      for (let i = 0; i < 50; i++) {
        virtualTree[`virtual${i}`] = {
          name: `virtual${i}`,
          type: 'virtual-directory',
          onSelect: async () => {
            // Simulate varying load times
            await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
            
            // Return different sized content
            const content: any = {};
            const itemCount = Math.floor(Math.random() * 20) + 5;
            for (let j = 0; j < itemCount; j++) {
              content[`vitem${j}`] = {
                name: `vitem${j}`,
                type: 'action',
                action: () => console.log(`Virtual item ${j}`)
              };
            }
            return content;
          }
        };
      }
      
      (window as any).testDirectoryTree = virtualTree;
      
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
    
    // Test loading multiple virtual directories
    const { duration: virtualLoadTime } = await measurePerformance(async () => {
      for (let i = 0; i < 5; i++) {
        // Navigate to virtual directory
        await page.keyboard.press('1');
        
        // Wait for loading to complete
        await page.waitForFunction(() => {
          const host = document.querySelector('#dirnav-host');
          const shadowRoot = host?.shadowRoot;
          const loading = shadowRoot?.querySelector('.dirnav-error-loading');
          return !loading || getComputedStyle(loading as HTMLElement).display === 'none';
        }, {}, { timeout: 5000 });
        
        // Navigate back
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(100);
      }
      return true;
    }, 'Multiple virtual directory loads');
    
    expect(virtualLoadTime).toBeLessThan(3000);
    
    // Verify no memory leaks by checking that component is still responsive
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
  });

  test('should maintain performance with pagination simulation', async ({ page }) => {
    const helper = await setupTest(page);
    await helper.showDirnav();
    
    // Test pagination-like navigation performance with existing tree structure
    const { duration: paginationTime } = await measurePerformance(async () => {
      // Simulate rapid page navigation by using keyboard shortcuts
      for (let cycle = 0; cycle < 5; cycle++) {
        // Navigate through items quickly
        await page.keyboard.press('1');
        await page.waitForTimeout(20);
        await page.keyboard.press('2');
        await page.waitForTimeout(20);
        await page.keyboard.press('3');
        await page.waitForTimeout(20);
        await page.keyboard.press('4');
        await page.waitForTimeout(20);
        
        // Navigate back to reset state
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(20);
      }
      return true;
    }, 'Pagination-like navigation cycles');
    
    expect(paginationTime).toBeLessThan(1000);
    
    // Verify component is still functional
    expect(await helper.isVisibleInShadow('#dirnav-window')).toBe(true);
  });

  test('should handle component lifecycle efficiently', async ({ page }) => {
    // Measure initial memory
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Test component show/hide cycles for memory efficiency
    const helper = await setupTest(page);
    
    const { duration: lifecycleTime } = await measurePerformance(async () => {
      // Perform multiple show/hide cycles
      for (let i = 0; i < 10; i++) {
        await helper.showDirnav();
        await page.keyboard.press('1'); // Navigate
        await page.waitForTimeout(50);
        await page.keyboard.press('Backspace'); // Navigate back
        await page.waitForTimeout(50);
        await helper.hideDirnav();
        await page.waitForTimeout(50);
      }
      return true;
    }, 'Component lifecycle operations');
    
    expect(lifecycleTime).toBeLessThan(3000);
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });
    
    // Measure final memory
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Memory should not have grown significantly (allow for some variance)
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryGrowth = finalMemory - initialMemory;
      const growthPercentage = (memoryGrowth / initialMemory) * 100;
      console.log(`Memory growth: ${memoryGrowth} bytes (${growthPercentage.toFixed(2)}%)`);
      
      // Allow up to 100% memory growth (generous threshold for test stability)
      expect(growthPercentage).toBeLessThan(100);
    }
  });
});