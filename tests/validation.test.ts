import { test, expect } from '@playwright/test';
import { setupTest, teardownTest } from './test-setup';

test.describe('Directory Tree Validation', () => {
  test.beforeEach(async ({ page }) => {
    await setupTest(page);
  });

  test.afterEach(async ({ page }) => {
    await teardownTest(page);
  });

  test('should validate a simple valid directory tree', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Import validation functions from the component
      const validTree = {
        'file1': { name: 'file1', type: 'action', action: () => {} },
        'folder1': { 
          name: 'folder1', 
          type: 'directory', 
          children: {
            'file2': { name: 'file2', type: 'action', action: () => {} }
          }
        }
      };

      // Access validation function from the global scope (injected by component)
      const validateDirectoryTree = (window as any).validateDirectoryTree;
      if (!validateDirectoryTree) {
        throw new Error('validateDirectoryTree function not available');
      }

      return validateDirectoryTree(validTree);
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject directory with more than 23 items', async ({ page }) => {
    const result = await page.evaluate(() => {
      const oversizedTree: any = {};
      
      // Create 24 items to exceed the limit
      for (let i = 1; i <= 24; i++) {
        oversizedTree[`item${i}`] = { 
          name: `item${i}`, 
          type: 'action', 
          action: () => {} 
        };
      }

      const validateDirectoryTree = (window as any).validateDirectoryTree;
      return validateDirectoryTree(oversizedTree);
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('24 items');
    expect(result.errors[0].message).toContain('maximum allowed is 23');
  });

  test('should accept directory with exactly 23 items', async ({ page }) => {
    const result = await page.evaluate(() => {
      const maxSizeTree: any = {};
      
      // Create exactly 23 items
      for (let i = 1; i <= 23; i++) {
        maxSizeTree[`item${i}`] = { 
          name: `item${i}`, 
          type: 'action', 
          action: () => {} 
        };
      }

      const validateDirectoryTree = (window as any).validateDirectoryTree;
      return validateDirectoryTree(maxSizeTree);
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject invalid node types', async ({ page }) => {
    const result = await page.evaluate(() => {
      const invalidTree = {
        'invalid': { name: 'invalid', type: 'invalid-type' }
      };

      const validateDirectoryTree = (window as any).validateDirectoryTree;
      return validateDirectoryTree(invalidTree);
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Invalid node type');
  });

  test('should reject nodes without required properties', async ({ page }) => {
    const result = await page.evaluate(() => {
      const invalidTree = {
        'noname': { type: 'action' },
        'notype': { name: 'notype' }
      };

      const validateDirectoryTree = (window as any).validateDirectoryTree;
      return validateDirectoryTree(invalidTree);
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(2);
  });

  test('should recursively validate nested directories', async ({ page }) => {
    const result = await page.evaluate(() => {
      const nestedTree: any = {
        'parent': {
          name: 'parent',
          type: 'directory',
          children: {}
        }
      };
      
      // Add 24 items to the nested directory
      for (let i = 1; i <= 24; i++) {
        nestedTree.parent.children[`item${i}`] = { 
          name: `item${i}`, 
          type: 'action', 
          action: () => {} 
        };
      }

      const validateDirectoryTree = (window as any).validateDirectoryTree;
      return validateDirectoryTree(nestedTree);
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].path).toBe('parent');
    expect(result.errors[0].message).toContain('24 items');
  });

  test('should validate action nodes', async ({ page }) => {
    const result = await page.evaluate(() => {
      const actionTree = {
        'validAction': { name: 'validAction', type: 'action', action: () => {} },
        'invalidAction': { name: 'invalidAction', type: 'action', action: 'not a function' as any }
      };

      const validateDirectoryTree = (window as any).validateDirectoryTree;
      return validateDirectoryTree(actionTree);
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('valid action function');
  });

  test('should validate input nodes', async ({ page }) => {
    const result = await page.evaluate(() => {
      const inputTree = {
        'validInput': { name: 'validInput', type: 'input', localStorageKey: 'key1' },
        'invalidInput': { name: 'invalidInput', type: 'input', localStorageKey: 123 as any }
      };

      const validateDirectoryTree = (window as any).validateDirectoryTree;
      return validateDirectoryTree(inputTree);
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('localStorageKey must be a string');
  });

  test('should validate virtual directory nodes', async ({ page }) => {
    const result = await page.evaluate(() => {
      const virtualTree = {
        'validVirtual': { 
          name: 'validVirtual', 
          type: 'virtual-directory', 
          onSelect: async () => ({}) 
        },
        'invalidVirtual': { 
          name: 'invalidVirtual', 
          type: 'virtual-directory', 
          onSelect: 'not a function' as any 
        }
      };

      const validateDirectoryTree = (window as any).validateDirectoryTree;
      return validateDirectoryTree(virtualTree);
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('valid onSelect function');
  });

  test('should reject key-name mismatches', async ({ page }) => {
    const result = await page.evaluate(() => {
      const mismatchTree = {
        'key1': { name: 'differentName', type: 'action', action: () => {} }
      };

      const validateDirectoryTree = (window as any).validateDirectoryTree;
      return validateDirectoryTree(mismatchTree);
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('does not match node name');
  });

  test('should throw error when validation fails with strict mode', async ({ page }) => {
    const result = await page.evaluate(() => {
      const invalidTree = {
        'invalid': { name: 'invalid', type: 'invalid-type' }
      };

      const validateDirectoryTreeStrict = (window as any).validateDirectoryTreeStrict;
      
      try {
        validateDirectoryTreeStrict(invalidTree);
        return { threw: false, message: '' };
      } catch (error) {
        return { 
          threw: true, 
          message: error instanceof Error ? error.message : String(error) 
        };
      }
    });

    expect(result.threw).toBe(true);
    expect(result.message).toContain('Directory tree validation failed');
  });

  test('should not throw error when throwOnError is false', async ({ page }) => {
    const result = await page.evaluate(() => {
      const invalidTree = {
        'invalid': { name: 'invalid', type: 'invalid-type' }
      };

      const validateDirectoryTreeStrict = (window as any).validateDirectoryTreeStrict;
      return validateDirectoryTreeStrict(invalidTree, false);
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  test('should reject null or undefined trees', async ({ page }) => {
    const result = await page.evaluate(() => {
      const validateDirectoryTree = (window as any).validateDirectoryTree;
      
      const result1 = validateDirectoryTree(null);
      const result2 = validateDirectoryTree(undefined);
      
      return { result1, result2 };
    });

    expect(result.result1.isValid).toBe(false);
    expect(result.result2.isValid).toBe(false);
    expect(result.result1.errors[0].message).toContain('must be a valid object');
    expect(result.result2.errors[0].message).toContain('must be a valid object');
  });
});