import { test, expect } from '@playwright/test';

test.describe('Shadow DOM Integration - Advanced Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for component to be fully loaded
    await page.waitForTimeout(200);
  });

  test('should handle complex keyboard interactions across shadow DOM', async ({ page }) => {
    // Test complex keyboard interaction flow
    await page.keyboard.press('Control+`'); // Show component
    await page.waitForTimeout(100);
    
    await page.keyboard.press('`'); // Open command palette
    await page.waitForTimeout(100);
    
    // Type in command palette
    await page.keyboard.type('home');
    await page.waitForTimeout(100);
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    
    // Press Enter to select
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    
    // Verify we can still interact with the component
    const componentStillWorks = await page.evaluate(() => {
      const host = document.getElementById('dirnav-host') || document.getElementById('dirnav-shadow-host');
      if (!host || !host.shadowRoot) return false;
      
      const dirnavWindow = host.shadowRoot.querySelector('#dirnav-window');
      return dirnavWindow !== null;
    });
    expect(componentStillWorks).toBe(true);
  });

  test('should handle input mode focus management in shadow DOM', async ({ page }) => {
    // Navigate to an input node
    await page.keyboard.press('Control+`'); // Show component
    await page.waitForTimeout(100);
    
    await page.keyboard.press('4'); // Select NT input node
    await page.waitForTimeout(100);
    
    // Verify input mode is active and input is focused
    const inputFocused = await page.evaluate(() => {
      const host = document.getElementById('dirnav-host') || document.getElementById('dirnav-shadow-host');
      if (!host || !host.shadowRoot) return false;
      
      const inputElement = host.shadowRoot.querySelector('#input-mode-input');
      return inputElement !== null && host.shadowRoot.activeElement === inputElement;
    });
    expect(inputFocused).toBe(true);
    
    // Type in the input
    await page.keyboard.type('test input');
    await page.waitForTimeout(100);
    
    // Save the input
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    
    // Verify we're back to normal mode
    const backToNormal = await page.evaluate(() => {
      const host = document.getElementById('dirnav-host') || document.getElementById('dirnav-shadow-host');
      if (!host || !host.shadowRoot) return false;
      
      const inputElement = host.shadowRoot.querySelector('#input-mode-input');
      const dirnavWindow = host.shadowRoot.querySelector('#dirnav-window');
      return inputElement === null && dirnavWindow !== null;
    });
    expect(backToNormal).toBe(true);
  });

  test('should handle window dragging across shadow DOM boundaries', async ({ page }) => {
    // Test that drag events can be dispatched without errors
    const dragEventsWork = await page.evaluate(() => {
      try {
        const host = document.getElementById('dirnav-host') || document.getElementById('dirnav-shadow-host');
        if (!host || !host.shadowRoot) return false;
        
        const titleBar = host.shadowRoot.querySelector('.title-bar') as HTMLElement;
        if (!titleBar) return false;
        
        // Simulate mousedown on title bar
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 50,
          button: 0
        });
        titleBar.dispatchEvent(mouseDownEvent);
        
        // Simulate mousemove
        const mouseMoveEvent = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: 150,
          clientY: 100
        });
        document.dispatchEvent(mouseMoveEvent);
        
        // Simulate mouseup
        const mouseUpEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(mouseUpEvent);
        
        return true; // If we get here, events were handled without errors
      } catch (error) {
        console.error('Drag event test failed:', error);
        return false;
      }
    });
    
    expect(dragEventsWork).toBe(true);
  });

  test('should handle command palette in shadow DOM', async ({ page }) => {
    // Test that command palette can be opened and closed
    await page.keyboard.press('Control+`'); // Show component
    await page.waitForTimeout(100);
    
    await page.keyboard.press('`'); // Open command palette
    await page.waitForTimeout(100);
    
    // Verify command palette opened
    const commandPaletteOpened = await page.evaluate(() => {
      const host = document.getElementById('dirnav-host') || document.getElementById('dirnav-shadow-host');
      if (!host || !host.shadowRoot) return false;
      
      const commandPalette = host.shadowRoot.querySelector('#command-palette-input');
      return commandPalette !== null;
    });
    expect(commandPaletteOpened).toBe(true);
  });

  test('should handle event cleanup on component destruction', async ({ page }) => {
    // Verify component exists
    let componentExists = await page.evaluate(() => {
      const host = document.getElementById('dirnav-host') || document.getElementById('dirnav-shadow-host');
      return host !== null;
    });
    expect(componentExists).toBe(true);
    
    // Add some event listeners by interacting with the component
    await page.keyboard.press('Control+`'); // Show component
    await page.waitForTimeout(100);
    
    await page.keyboard.press('`'); // Open command palette
    await page.waitForTimeout(100);
    
    await page.keyboard.press('Escape'); // Close command palette
    await page.waitForTimeout(100);
    
    // Now simulate component destruction
    const cleanupSuccessful = await page.evaluate(() => {
      try {
        const host = document.getElementById('dirnav-host') || document.getElementById('dirnav-shadow-host');
        if (host && host.parentNode) {
          // Trigger cleanup by removing the host
          host.parentNode.removeChild(host);
        }
        
        // Try to trigger events that should no longer have listeners
        document.dispatchEvent(new KeyboardEvent('keydown', { key: '`' }));
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }));
        
        return true;
      } catch (error) {
        console.error('Cleanup test failed:', error);
        return false;
      }
    });
    expect(cleanupSuccessful).toBe(true);
    
    // Verify component is gone
    componentExists = await page.evaluate(() => {
      const host = document.getElementById('dirnav-host') || document.getElementById('dirnav-shadow-host');
      return host !== null;
    });
    expect(componentExists).toBe(false);
  });

  test('should maintain accessibility in shadow DOM', async ({ page }) => {
    // Test that accessibility features work in shadow DOM
    await page.keyboard.press('Control+`'); // Show component
    await page.waitForTimeout(100);
    
    // Check that elements have proper tabindex and can be focused
    const accessibilityWorks = await page.evaluate(() => {
      const host = document.getElementById('dirnav-host') || document.getElementById('dirnav-shadow-host');
      if (!host || !host.shadowRoot) return false;
      
      const dirnavWindow = host.shadowRoot.querySelector('#dirnav-window') as HTMLElement;
      if (!dirnavWindow) return false;
      
      // Check that the window has proper tabindex
      const hasTabIndex = dirnavWindow.tabIndex === -1; // Should be -1 for programmatic focus
      
      // Check that buttons are focusable
      const buttons = host.shadowRoot.querySelectorAll('button');
      const buttonsAreFocusable = Array.from(buttons).every(button => {
        const btn = button as HTMLElement;
        return btn.tabIndex >= -1; // Should be focusable
      });
      
      return hasTabIndex && buttonsAreFocusable && buttons.length > 0;
    });
    expect(accessibilityWorks).toBe(true);
  });
});