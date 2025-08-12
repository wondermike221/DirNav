import { Page } from '@playwright/test';

export interface TestDirectoryTree {
  [key: string]: any;
}

/**
 * Creates a test directory tree for consistent testing
 */
export function createTestDirectoryTree(): TestDirectoryTree {
  return {
    'folder1': {
      name: 'folder1',
      type: 'directory',
      children: {
        'file1.txt': { name: 'file1.txt', type: 'action', action: () => console.log('file1') },
        'file2.txt': { name: 'file2.txt', type: 'action', action: () => console.log('file2') }
      }
    },
    'myInput': { name: 'myInput', type: 'input', localStorageKey: 'myInputKey' },
    'virtual-folder': {
      name: 'virtual-folder',
      type: 'virtual-directory',
      onSelect: async () => ({
        'file.txt': { name: 'file.txt', type: 'action', action: () => console.log('virtual file') }
      })
    },
    'action1': { name: 'action1', type: 'action', action: () => console.log('action1') }
  };
}

/**
 * Helper class for interacting with DirNav component in shadow DOM
 */
export class DirnavTestHelper {
  constructor(private page: Page) {}

  /**
   * Gets the shadow root element
   */
  async getShadowRoot() {
    return await this.page.evaluateHandle(() => {
      const host = document.querySelector('#dirnav-host');
      return host?.shadowRoot;
    });
  }

  /**
   * Finds an element within the shadow DOM
   */
  async findInShadow(selector: string) {
    return await this.page.evaluateHandle((selector) => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      return shadowRoot?.querySelector(selector);
    }, selector);
  }

  /**
   * Finds all elements within the shadow DOM
   */
  async findAllInShadow(selector: string) {
    return await this.page.evaluateHandle((selector) => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      return shadowRoot?.querySelectorAll(selector);
    }, selector);
  }

  /**
   * Clicks an element within the shadow DOM
   */
  async clickInShadow(selector: string) {
    // Handle text-based selectors by finding the element first
    if (selector.startsWith('text=')) {
      const text = selector.substring(5);
      const clicked = await this.page.evaluate((text) => {
        const host = document.querySelector('#dirnav-host');
        const shadowRoot = host?.shadowRoot;
        const elements = shadowRoot?.querySelectorAll('*');
        if (elements) {
          for (const element of Array.from(elements)) {
            if (element.textContent?.includes(text)) {
              (element as HTMLElement).click();
              return true;
            }
          }
        }
        return false;
      }, text);
      
      if (!clicked) {
        throw new Error(`Element with text "${text}" not found`);
      }
    } else {
      // For regular selectors, use evaluate to find and click the element in shadow DOM
      const clicked = await this.page.evaluate((selector) => {
        const host = document.querySelector('#dirnav-host');
        const shadowRoot = host?.shadowRoot;
        const element = shadowRoot?.querySelector(selector) as HTMLElement;
        if (element) {
          element.click();
          return true;
        }
        return false;
      }, selector);
      
      if (!clicked) {
        throw new Error(`Element not found: ${selector}`);
      }
    }
  }

  /**
   * Types text into an input within the shadow DOM
   */
  async typeInShadow(selector: string, text: string) {
    // Find the element in shadow DOM and set its value directly
    const typed = await this.page.evaluate(({ selector, text }) => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const element = shadowRoot?.querySelector(selector) as HTMLInputElement;
      if (element) {
        // Clear the input first
        element.value = '';
        element.focus();
        
        // Set the full value at once
        element.value = text;
        
        // Create and dispatch a proper input event that SolidJS can handle
        const inputEvent = new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text
        });
        
        // Dispatch the event on the element
        element.dispatchEvent(inputEvent);
        
        // Also dispatch a change event for good measure
        const changeEvent = new Event('change', { bubbles: true });
        element.dispatchEvent(changeEvent);
        
        return true;
      }
      return false;
    }, { selector, text });
    
    if (!typed) {
      throw new Error(`Input element not found: ${selector}`);
    }
  }

  /**
   * Checks if an element exists within the shadow DOM
   */
  async existsInShadow(selector: string): Promise<boolean> {
    return await this.page.evaluate((selector) => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      
      // Handle text-based selectors
      if (selector.startsWith('text=')) {
        const text = selector.substring(5);
        const elements = shadowRoot?.querySelectorAll('*');
        if (elements) {
          for (const element of Array.from(elements)) {
            if (element.textContent?.includes(text)) {
              return true;
            }
          }
        }
        return false;
      } else {
        return !!shadowRoot?.querySelector(selector);
      }
    }, selector);
  }

  /**
   * Checks if an element is visible within the shadow DOM
   */
  async isVisibleInShadow(selector: string): Promise<boolean> {
    return await this.page.evaluate((selector) => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      
      // Handle text-based selectors
      if (selector.startsWith('text=')) {
        const text = selector.substring(5);
        const elements = shadowRoot?.querySelectorAll('*');
        if (elements) {
          for (const element of Array.from(elements)) {
            if (element.textContent?.includes(text)) {
              const computedStyle = getComputedStyle(element as HTMLElement);
              return computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden' && computedStyle.opacity !== '0';
            }
          }
        }
        return false;
      } else {
        const element = shadowRoot?.querySelector(selector);
        if (!element) return false;
        
        const computedStyle = getComputedStyle(element as HTMLElement);
        return computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden' && computedStyle.opacity !== '0';
      }
    }, selector);
  }

  /**
   * Gets text content of an element within the shadow DOM
   */
  async getTextInShadow(selector: string): Promise<string> {
    return await this.page.evaluate((selector) => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const element = shadowRoot?.querySelector(selector);
      return element?.textContent || '';
    }, selector);
  }

  /**
   * Waits for an element to be visible within the shadow DOM
   */
  async waitForShadowElement(selector: string, timeout = 5000): Promise<void> {
    await this.page.waitForFunction(
      (selector) => {
        const host = document.querySelector('#dirnav-host');
        const shadowRoot = host?.shadowRoot;
        
        // Handle text-based selectors
        if (selector.startsWith('text=')) {
          const text = selector.substring(5);
          const elements = shadowRoot?.querySelectorAll('*');
          if (elements) {
            for (const element of Array.from(elements)) {
              if (element.textContent?.includes(text)) {
                const computedStyle = getComputedStyle(element as HTMLElement);
                return computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden' && computedStyle.opacity !== '0';
              }
            }
          }
          return false;
        } else {
          const element = shadowRoot?.querySelector(selector);
          if (!element) return false;
          
          const computedStyle = getComputedStyle(element as HTMLElement);
          return computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden' && computedStyle.opacity !== '0';
        }
      },
      selector,
      { timeout }
    );
  }

  /**
   * Waits for an element to be hidden within the shadow DOM
   */
  async waitForShadowElementHidden(selector: string, timeout = 5000): Promise<void> {
    await this.page.waitForFunction(
      (selector) => {
        const host = document.querySelector('#dirnav-host');
        const shadowRoot = host?.shadowRoot;
        const element = shadowRoot?.querySelector(selector);
        if (!element) return true;
        
        const computedStyle = getComputedStyle(element as HTMLElement);
        return computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0';
      },
      selector,
      { timeout }
    );
  }

  /**
   * Triggers a keyboard event on the shadow DOM
   */
  async keyboardInShadow(key: string) {
    await this.page.evaluate((key) => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const event = new KeyboardEvent('keydown', { key, bubbles: true });
      shadowRoot?.dispatchEvent(event);
    }, key);
  }

  /**
   * Shows the DirNav component using Ctrl+` (if not already visible)
   */
  async showDirnav() {
    const isVisible = await this.isVisibleInShadow('#dirnav-window');
    if (!isVisible) {
      await this.page.keyboard.press('Control+`');
      await this.waitForShadowElement('#dirnav-window');
    }
  }

  /**
   * Hides the DirNav component using Escape
   */
  async hideDirnav() {
    const isVisible = await this.isVisibleInShadow('#dirnav-window');
    if (isVisible) {
      // Focus the window first to ensure keyboard events are handled
      await this.page.evaluate(() => {
        const host = document.querySelector('#dirnav-host');
        const shadowRoot = host?.shadowRoot;
        const window = shadowRoot?.querySelector('#dirnav-window') as HTMLElement;
        if (window) {
          window.focus();
        }
      });
      await this.page.keyboard.press('Escape');
      await this.waitForShadowElementHidden('#dirnav-window');
    }
  }

  /**
   * Opens the command palette using backtick
   */
  async openCommandPalette() {
    // Focus the window first to ensure keyboard events are handled
    await this.page.evaluate(() => {
      const host = document.querySelector('#dirnav-host');
      const shadowRoot = host?.shadowRoot;
      const window = shadowRoot?.querySelector('#dirnav-window') as HTMLElement;
      if (window) {
        window.focus();
      }
    });
    await this.page.keyboard.press('`');
    await this.waitForShadowElement('input[placeholder="Search..."]');
  }
}

/**
 * Sets up test data and clears localStorage
 */
export async function setupTest(page: Page) {
  // Navigate to test page first
  await page.goto('/');
  
  // Clear localStorage (after navigation to avoid security errors)
  try {
    await page.evaluate(() => {
      localStorage.clear();
    });
  } catch (error) {
    // Ignore localStorage errors in some test environments
    console.warn('Could not clear localStorage:', error);
  }
  
  // Wait for the component to be initialized
  await page.waitForSelector('#dirnav-host');
  
  return new DirnavTestHelper(page);
}

/**
 * Cleans up after test
 */
export async function teardownTest(page: Page) {
  // Clear localStorage
  try {
    await page.evaluate(() => {
      localStorage.clear();
    });
  } catch (error) {
    // Ignore localStorage errors in some test environments
    console.warn('Could not clear localStorage:', error);
  }
}