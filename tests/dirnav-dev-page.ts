import { type Page } from '@playwright/test';

/**
 * @deprecated This class is deprecated. Use DirnavTestHelper from test-setup.ts instead.
 * This file is kept for backward compatibility but should not be used in new tests.
 */
export class DirnavDevPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
        console.warn('DirnavDevPage is deprecated. Use DirnavTestHelper from test-setup.ts instead.');
    }

    // Deprecated methods - kept for compatibility but will not work with shadow DOM
    async dragTo(x: number, y: number) {
        throw new Error('DirnavDevPage is deprecated. Use DirnavTestHelper from test-setup.ts instead.');
    }

    async resizeTo(width: number, height: number) {
        throw new Error('DirnavDevPage is deprecated. Use DirnavTestHelper from test-setup.ts instead.');
    }

    async reset() {
        throw new Error('DirnavDevPage is deprecated. Use DirnavTestHelper from test-setup.ts instead.');
    }

    async close() {
        throw new Error('DirnavDevPage is deprecated. Use DirnavTestHelper from test-setup.ts instead.');
    }

    async back() {
        throw new Error('DirnavDevPage is deprecated. Use DirnavTestHelper from test-setup.ts instead.');
    }
}