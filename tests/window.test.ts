import { test, expect } from '@playwright/test';
import { setupTest, teardownTest, DirnavTestHelper } from './test-setup';

test.describe('Window component', () => {
  let helper: DirnavTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = await setupTest(page);
  });

  test.afterEach(async ({ page }) => {
    await teardownTest(page);
  });

  test('should render with the correct title when shown', async ({ page }) => {
    // Show the component
    await helper.showDirnav();
    
    // Check title
    const titleText = await helper.getTextInShadow('#window-title');
    expect(titleText).toBe('~');
  });

  test('should be draggable', async ({ page }) => {
    // Show the component
    await helper.showDirnav();
    
    // Get initial position
    const initialPosition = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const window = shadowRoot?.querySelector('#dirnav-window') as HTMLElement;
      return window ? window.getBoundingClientRect() : null;
    });
    
    expect(initialPosition).not.toBeNull();
    
    // Get the title bar position for dragging
    const titleBarPosition = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const titleBar = shadowRoot?.querySelector('.title-bar') as HTMLElement;
      if (titleBar) {
        const rect = titleBar.getBoundingClientRect();
        return {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2
        };
      }
      return null;
    });
    
    expect(titleBarPosition).not.toBeNull();
    
    // Use Playwright's mouse API to perform the drag
    await page.mouse.move(titleBarPosition!.x, titleBarPosition!.y);
    await page.mouse.down();
    await page.mouse.move(titleBarPosition!.x + 100, titleBarPosition!.y + 100);
    await page.mouse.up();
    
    // Wait a bit for the drag to complete
    await page.waitForTimeout(100);
    
    // Get final position
    const finalPosition = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const window = shadowRoot?.querySelector('#dirnav-window') as HTMLElement;
      return window ? window.getBoundingClientRect() : null;
    });
    
    expect(finalPosition).not.toBeNull();
    // Position should have changed (allowing for some tolerance)
    const moved = Math.abs(finalPosition!.x - initialPosition!.x) > 10 || 
                  Math.abs(finalPosition!.y - initialPosition!.y) > 10;
    expect(moved).toBe(true);
  });

  test('should be resizable', async ({ page }) => {
    // Show the component
    await helper.showDirnav();
    
    // Get initial size
    const initialSize = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const window = shadowRoot?.querySelector('#dirnav-window') as HTMLElement;
      return window ? window.getBoundingClientRect() : null;
    });
    
    expect(initialSize).not.toBeNull();
    
    // Get the resize handle position for resizing
    const resizeHandlePosition = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const resizeHandle = shadowRoot?.querySelector('#resize-handle') as HTMLElement;
      if (resizeHandle) {
        const rect = resizeHandle.getBoundingClientRect();
        return {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2
        };
      }
      return null;
    });
    
    expect(resizeHandlePosition).not.toBeNull();
    
    // Use Playwright's mouse API to perform the resize
    await page.mouse.move(resizeHandlePosition!.x, resizeHandlePosition!.y);
    await page.mouse.down();
    await page.mouse.move(resizeHandlePosition!.x + 100, resizeHandlePosition!.y + 100);
    await page.mouse.up();
    
    // Wait a bit for the resize to complete
    await page.waitForTimeout(100);
    
    // Get final size
    const finalSize = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const window = shadowRoot?.querySelector('#dirnav-window') as HTMLElement;
      return window ? window.getBoundingClientRect() : null;
    });
    
    expect(finalSize).not.toBeNull();
    // Size should have changed
    const resized = finalSize!.width > initialSize!.width || 
                    finalSize!.height > initialSize!.height;
    expect(resized).toBe(true);
  });

  test('should reset to default size and position', async ({ page }) => {
    // Show the component
    await helper.showDirnav();
    
    // Click reset button
    await helper.clickInShadow('#resize-button');
    
    // Wait for the reset to complete
    await page.waitForTimeout(100);
    
    // Check that window is in default position (centered)
    const position = await page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const window = shadowRoot?.querySelector('#dirnav-window') as HTMLElement;
      return window ? window.getBoundingClientRect() : null;
    });
    
    expect(position).not.toBeNull();
    
    // Window should be roughly centered (allowing for more tolerance due to different viewport sizes)
    const viewport = page.viewportSize()!;
    const expectedX = viewport.width * 0.375; // 37.5% from left (centered for 25% width)
    const expectedY = viewport.height * 0.375; // 37.5% from top (centered for 25% height)
    
    // Use more generous tolerance for WebKit
    expect(Math.abs(position!.x - expectedX)).toBeLessThan(100);
    expect(Math.abs(position!.y - expectedY)).toBeLessThan(100);
  });

  test('should close when the close button is clicked', async ({ page }) => {
    // Show the component
    await helper.showDirnav();
    
    // Click close button
    await helper.clickInShadow('#close-button');
    
    // Window should be hidden
    await helper.waitForShadowElementHidden('#dirnav-window');
    expect(await helper.existsInShadow('#dirnav-window')).toBe(false);
  });
});
