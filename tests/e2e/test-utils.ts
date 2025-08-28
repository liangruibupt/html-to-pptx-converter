import { Page, expect } from '@playwright/test';

/**
 * Utility functions for end-to-end tests
 * 
 * These utilities provide common operations used across multiple test files.
 */

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Upload an HTML file with specified content
   */
  async uploadHtmlFile(content: string, filename: string = 'test.html') {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: filename,
      mimeType: 'text/html',
      buffer: Buffer.from(content)
    });
  }

  /**
   * Enter HTML content directly in the textarea
   */
  async enterHtmlContent(content: string) {
    await this.page.locator('[data-testid="html-input-tab"]').click();
    await this.page.locator('[data-testid="html-textarea"]').fill(content);
  }

  /**
   * Set conversion configuration
   */
  async setConfiguration(config: {
    layout?: string;
    includeImages?: boolean;
    theme?: string;
    splitStrategy?: string;
    customSelector?: string;
  }) {
    if (config.layout) {
      await this.page.locator('[data-testid="slide-layout-select"]').selectOption(config.layout);
    }

    if (config.includeImages !== undefined) {
      const checkbox = this.page.locator('[data-testid="include-images-checkbox"]');
      if (config.includeImages) {
        await checkbox.check();
      } else {
        await checkbox.uncheck();
      }
    }

    if (config.theme) {
      await this.page.locator('[data-testid="theme-select"]').selectOption(config.theme);
    }

    if (config.splitStrategy) {
      await this.page.locator('[data-testid="split-strategy-select"]').selectOption(config.splitStrategy);
      
      if (config.splitStrategy === 'by-custom-selector' && config.customSelector) {
        await this.page.locator('[data-testid="custom-selector-input"]').fill(config.customSelector);
      }
    }
  }

  /**
   * Start conversion and wait for completion
   */
  async convertAndWaitForCompletion(timeout: number = 15000) {
    await this.page.locator('[data-testid="convert-button"]').click();
    await expect(this.page.locator('[data-testid="download-button"]')).toBeVisible({ timeout });
  }

  /**
   * Download the generated PPTX file
   */
  async downloadPptx() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.locator('[data-testid="download-button"]').click();
    return await downloadPromise;
  }

  /**
   * Verify error message is displayed
   */
  async verifyErrorMessage(expectedText?: string) {
    const errorMessage = this.page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    
    if (expectedText) {
      await expect(errorMessage).toContainText(expectedText);
    }
  }

  /**
   * Verify validation error is displayed
   */
  async verifyValidationError(expectedText?: string) {
    const validationError = this.page.locator('[data-testid="validation-error"]');
    await expect(validationError).toBeVisible();
    
    if (expectedText) {
      await expect(validationError).toContainText(expectedText);
    }
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults() {
    await this.page.locator('[data-testid="reset-defaults-button"]').click();
  }

  /**
   * Verify HTML preview is displayed with content
   */
  async verifyHtmlPreview(expectedContent?: string) {
    const preview = this.page.locator('[data-testid="html-preview"]');
    await expect(preview).toBeVisible();
    
    if (expectedContent) {
      await expect(preview).toContainText(expectedContent);
    }
  }

  /**
   * Verify conversion progress is shown
   */
  async verifyConversionProgress() {
    const progress = this.page.locator('[data-testid="conversion-progress"]');
    await expect(progress).toBeVisible();
  }

  /**
   * Generate sample HTML content for testing
   */
  static generateSampleHtml(options: {
    title?: string;
    sections?: number;
    includeImages?: boolean;
    includeTables?: boolean;
    includeLists?: boolean;
    includeLinks?: boolean;
  } = {}) {
    const {
      title = 'Sample Document',
      sections = 3,
      includeImages = false,
      includeTables = false,
      includeLists = false,
      includeLinks = false
    } = options;

    let html = `<html><body><h1>${title}</h1>`;

    for (let i = 1; i <= sections; i++) {
      html += `<h2>Section ${i}</h2>`;
      html += `<p>This is the content for section ${i}. It contains various elements for testing.</p>`;

      if (includeImages) {
        html += `<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwNzNlNiIvPjwvc3ZnPg==" alt="Test Image ${i}" />`;
      }

      if (includeTables) {
        html += `
          <table>
            <tr><th>Header 1</th><th>Header 2</th></tr>
            <tr><td>Data ${i}.1</td><td>Data ${i}.2</td></tr>
          </table>
        `;
      }

      if (includeLists) {
        html += `
          <ul>
            <li>List item ${i}.1</li>
            <li>List item ${i}.2</li>
          </ul>
        `;
      }

      if (includeLinks) {
        html += `<p>Visit <a href="https://example${i}.com">Example ${i}</a> for more information.</p>`;
      }
    }

    html += '</body></html>';
    return html;
  }

  /**
   * Wait for element to be stable (not changing)
   */
  async waitForStable(selector: string, timeout: number = 5000) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    
    // Wait for element to stop changing
    let previousText = '';
    let stableCount = 0;
    const maxChecks = 10;
    
    for (let i = 0; i < maxChecks; i++) {
      const currentText = await element.textContent();
      if (currentText === previousText) {
        stableCount++;
        if (stableCount >= 3) break; // Stable for 3 checks
      } else {
        stableCount = 0;
      }
      previousText = currentText || '';
      await this.page.waitForTimeout(100);
    }
  }

  /**
   * Verify responsive layout at different viewport sizes
   */
  async verifyResponsiveLayout() {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Verify main container is visible and fits viewport
      const container = this.page.locator('[data-testid="app-container"]');
      await expect(container).toBeVisible();
      
      const boundingBox = await container.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(viewport.width);
    }
  }
}

/**
 * Sample HTML content templates for testing
 */
export const SampleHtmlTemplates = {
  simple: '<html><body><h1>Simple Test</h1><p>Basic content</p></body></html>',
  
  complex: `
    <html>
      <body>
        <h1>Complex Document</h1>
        <h2>Section 1</h2>
        <p>Content with <strong>formatting</strong> and <em>emphasis</em>.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <h2>Section 2</h2>
        <table>
          <tr><th>Header 1</th><th>Header 2</th></tr>
          <tr><td>Data 1</td><td>Data 2</td></tr>
        </table>
      </body>
    </html>
  `,
  
  withImages: `
    <html>
      <body>
        <h1>Document with Images</h1>
        <p>This document contains images:</p>
        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwNzNlNiIvPjwvc3ZnPg==" alt="Test SVG" />
      </body>
    </html>
  `,
  
  malformed: `
    <html>
      <body>
        <h1>Malformed HTML
        <p>Unclosed paragraph
        <div>Unclosed div
        <strong>Unclosed strong
      </body>
    </html>
  `
};