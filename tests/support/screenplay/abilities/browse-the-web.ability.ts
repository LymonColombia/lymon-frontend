import { Page } from '@playwright/test';

export class BrowseTheWeb {
  private constructor(public readonly page: Page) {}

  static using(page: Page): BrowseTheWeb {
    return new BrowseTheWeb(page);
  }
}
