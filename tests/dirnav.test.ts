import { test, expect } from '@playwright/test';
import { Page } from 'playwright';
import { render } from 'solid-js/web';
import DirnavUI, { createDirTree } from '../src/DirnavUI';
import { createSignal } from 'solid-js';
import '../src/style.css';

// Helper function to mount the DirnavUI component for testing
const mountDirnavUIComponent = async (page: Page, initialTree: any) => {
  await page.setContent(`
    <div id="root"></div>
  `);

  await page.evaluate(({
    initialTree
  }) => {
    const { render } = window['SolidWeb'];
    const DirnavUI = window['DirnavUIComponent'];
    const { createDirTree } = window['DirnavUIExports'];

    const sampleTree = createDirTree(initialTree);

    render(() => <DirnavUI initialTree={sampleTree} />, document.getElementById('root'));
  }, { initialTree });
};

// Expose components and Solid.js utilities globally for Playwright's page.evaluate
test.beforeEach(async ({ page }) => {
  await page.exposeFunction('SolidWeb', { render });
  await page.exposeFunction('DirnavUIComponent', DirnavUI);
  await page.exposeFunction('DirnavUIExports', { createDirTree });
  await page.exposeFunction('SolidJs', { createSignal });
});

const basicTree = {
  "folder1": {
    type: 'directory',
    children: {
      "file1.txt": { type: 'action', action: () => console.log('file1') },
    },
  },
  "folder2": {
    type: 'directory',
    children: {
      "file2.txt": { type: 'action', action: () => console.log('file2') },
    },
  },
  "action1": { type: 'action', action: () => console.log('action1') },
};

test('should navigate into a directory and back', async ({ page }) => {
  await mountDirnavUIComponent(page, basicTree);

  // Expect to see folder1 and folder2
  await expect(page.locator('text=folder1/')).toBeVisible();
  await expect(page.locator('text=folder2/')).toBeVisible();

  // Click on folder1
  await page.locator('text=folder1/').click();

  // Expect to see file1.txt and breadcrumbs updated
  await expect(page.locator('text=file1.txt')).toBeVisible();
  await expect(page.locator('.breadcrumbs-container')).toHaveText(/Home\/folder1/);

  // Click back button
  await page.locator('button:has-text("←")').click();

  // Expect to be back in the root directory
  await expect(page.locator('text=folder1/')).toBeVisible();
  await expect(page.locator('.breadcrumbs-container')).toHaveText(/Home/);
});
