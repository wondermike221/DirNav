import { test, expect } from '@playwright/test';
import { Page } from 'playwright';
import { render } from 'solid-js/web';
import Window from '../src/Window';
import { createSignal } from 'solid-js';
import { TitleContext } from '../src/TitleContext';

// Helper function to mount the Window component for testing
const mountWindowComponent = async (page: Page, initialTitle: string = 'Test Window', initialBackDisabled: boolean = true) => {
  await page.setContent(`
    <div id="root"></div>
  `);

  const [title, setTitle] = createSignal([{ name: initialTitle, path: '/', isClickable: true }]);

  await page.evaluate(({
    initialTitle,
    initialBackDisabled
  }) => {
    const { render } = window['SolidWeb'];
    const Window = window['WindowComponent']; // Assuming Window is globally exposed for evaluation
    const { TitleContext } = window['TitleContext']; // Assuming TitleContext is globally exposed
    const [title, setTitle] = window['SolidJs'].createSignal([{ name: initialTitle, path: '/', isClickable: true }]);

    render(() => (
      <TitleContext.Provider value={{ title, setTitle }}>
        <Window
          onBack={() => {}}
          backButtonDisabled={initialBackDisabled}
          onClose={() => { document.getElementById('root').style.display = 'none'; }}
        >
          <div>Window Content</div>
        </Window>
      </TitleContext.Provider>
    ), document.getElementById('root'));
  }, { initialTitle, initialBackDisabled });
};

// Expose components and Solid.js utilities globally for Playwright's page.evaluate
test.beforeEach(async ({ page }) => {
  await page.exposeFunction('SolidWeb', { render });
  await page.exposeFunction('WindowComponent', Window);
  await page.exposeFunction('TitleContext', { TitleContext });
  await page.exposeFunction('SolidJs', { createSignal });
});

test('Window component renders with correct title', async ({ page }) => {
  await mountWindowComponent(page, 'My Test Title');
  const titleText = await page.locator('.title-bar .text-align-center span').first().textContent();
  expect(titleText).toBe('My Test Title');
});

test('Window can be dragged', async ({ page }) => {
  await mountWindowComponent(page);
  const windowElement = page.locator('.dirnav-window');
  const titleBar = page.locator('.title-bar');

  const initialBoundingBox = await windowElement.boundingBox();
  expect(initialBoundingBox).not.toBeNull();

  await titleBar.dragTo(titleBar, { targetPosition: { x: 100, y: 100 } });

  const newBoundingBox = await windowElement.boundingBox();
  expect(newBoundingBox).not.toBeNull();

  // Check if the window has moved significantly
  expect(newBoundingBox!.x).toBeGreaterThan(initialBoundingBox!.x + 50); // Moved right
  expect(newBoundingBox!.y).toBeGreaterThan(initialBoundingBox!.y + 50); // Moved down
});

test('Window can be resized', async ({ page }) => {
  await mountWindowComponent(page);
  const windowElement = page.locator('.dirnav-window');
  const resizeHandle = page.locator('.resize-handle');

  const initialBoundingBox = await windowElement.boundingBox();
  expect(initialBoundingBox).not.toBeNull();

  await resizeHandle.dragTo(resizeHandle, { targetPosition: { x: 50, y: 50 } });

  const newBoundingBox = await windowElement.boundingBox();
  expect(newBoundingBox).not.toBeNull();

  // Check if the window has resized significantly
  expect(newBoundingBox!.width).toBeGreaterThan(initialBoundingBox!.width);
  expect(newBoundingBox!.height).toBeGreaterThan(initialBoundingBox!.height);
});

test('Window can be reset to default size and position', async ({ page }) => {
  await mountWindowComponent(page);
  const windowElement = page.locator('.dirnav-window');
  const titleBar = page.locator('.title-bar');
  const resetButton = page.locator('button:has-text("\u25a3")'); // The square button

  // Drag and resize first
  await titleBar.dragTo(titleBar, { targetPosition: { x: 100, y: 100 } });
  const resizeHandle = page.locator('.resize-handle');
  await resizeHandle.dragTo(resizeHandle, { targetPosition: { x: 50, y: 50 } });

  const movedAndResizedBoundingBox = await windowElement.boundingBox();
  expect(movedAndResizedBoundingBox).not.toBeNull();

  await resetButton.click();

  const defaultBoundingBox = await windowElement.boundingBox();
  expect(defaultBoundingBox).not.toBeNull();

  // Check if it's close to the default 25vw/25vh and centered
  // We'll use a tolerance since exact pixel values can vary slightly
  const viewportWidth = page.viewportSize()!.width;
  const viewportHeight = page.viewportSize()!.height;

  const expectedWidth = viewportWidth * 0.25;
  const expectedHeight = viewportHeight * 0.25;
  const expectedX = viewportWidth * 0.375;
  const expectedY = viewportHeight * 0.375;

  const tolerance = 5; // pixels

  expect(defaultBoundingBox!.width).toBeCloseTo(expectedWidth, tolerance);
  expect(defaultBoundingBox!.height).toBeCloseTo(expectedHeight, tolerance);
  expect(defaultBoundingBox!.x).toBeCloseTo(expectedX, tolerance);
  expect(defaultBoundingBox!.y).toBeCloseTo(expectedY, tolerance);
});

test('Window can be hidden and shown via close button and Ctrl+`', async ({ page }) => {
  await mountWindowComponent(page);
  const windowElement = page.locator('.dirnav-window');
  const closeButton = page.locator('button:has-text("X")');

  // Hide the window
  await closeButton.click();
  await expect(windowElement).not.toBeVisible();

  // Show the window using Ctrl+`
  await page.keyboard.press('Control+`');
  await expect(windowElement).toBeVisible();
});

test('Window position and size persist across reloads', async ({ page }) => {
  // First load: drag and resize
  await mountWindowComponent(page);
  const windowElement = page.locator('.dirnav-window');
  const titleBar = page.locator('.title-bar');
  const resizeHandle = page.locator('.resize-handle');

  await titleBar.dragTo(titleBar, { targetPosition: { x: 150, y: 150 } });
  await resizeHandle.dragTo(resizeHandle, { targetPosition: { x: 70, y: 70 } });

  const firstLoadBoundingBox = await windowElement.boundingBox();
  expect(firstLoadBoundingBox).not.toBeNull();

  // Reload the page
  await page.reload();
  await mountWindowComponent(page); // Remount the component to pick up persisted state

  const secondLoadBoundingBox = await windowElement.boundingBox();
  expect(secondLoadBoundingBox).not.toBeNull();

  // Check if position and size are approximately the same
  const tolerance = 5; // pixels
  expect(secondLoadBoundingBox!.x).toBeCloseTo(firstLoadBoundingBox!.x, tolerance);
  expect(secondLoadBoundingBox!.y).toBeCloseTo(firstLoadBoundingBox!.y, tolerance);
  expect(secondLoadBoundingBox!.width).toBeCloseTo(firstLoadBoundingBox!.width, tolerance);
  expect(secondLoadBoundingBox!.height).toBeCloseTo(firstLoadBoundingBox!.height, tolerance);
});