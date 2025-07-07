import { expect, type Locator, type Page } from '@playwright/test';

export class DirnavDevPage {
    readonly page: Page;
    readonly window: Locator;
    readonly titleBar: Locator;
    readonly title: Locator;
    readonly resizeHandle: Locator;
    readonly closeButton: Locator;
    readonly resetButton: Locator;
    readonly backButton: Locator;
    readonly breadcrumbs: Locator;
    readonly mainContent: Locator;
    readonly mainNavList: Locator;


    constructor(page: Page) {
        this.page = page;
        this.window = page.locator('#dirnav-window');
        this.titleBar = this.window.locator('header.title-bar');
        this.title = this.titleBar.locator('#window-title');
        this.resizeHandle = this.window.locator('#resize-handle');
        this.closeButton = this.window.locator('#close-button');
        this.resetButton = this.window.locator('#resize-button');
        this.backButton = this.window.locator('#back-button');
        this.breadcrumbs = this.window.locator('nav#breadcrumbs');
        this.mainContent = this.window.locator('#window-content');
        this.mainNavList = this.mainContent.locator('ol#main-nav-list');
    }

    async dragTo(x: number, y: number) {
        await this.titleBar.dragTo(this.page.locator('body'), {
            targetPosition: { x, y },
        });
    }

    async resizeTo(width: number, height: number) {
        await this.resizeHandle.dragTo(this.window, {
            targetPosition: { x: width, y: height },
        });
    }

    async reset() {
        await this.resetButton.click();
    }

    async close() {
        await this.closeButton.click();
    }

    async back() {
        await this.backButton.click();
    }


}