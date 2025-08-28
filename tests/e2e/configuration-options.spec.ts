import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for Configuration Options
 * 
 * These tests verify different configuration combinations work correctly.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 - Configuration options
 */

test.describe('Configuration Options', () => {
  const testHtml = `
    <html>
      <body>
        <h1>Configuration Test Document</h1>
        <p>This document tests various configuration options.</p>
        
        <h2>Section A</h2>
        <p>Content for section A with <strong>formatting</strong>.</p>
        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZmY2NjAwIi8+PC9zdmc+" alt="Test" />
        
        <h3>Subsection A.1</h3>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        
        <h2>Section B</h2>
        <table>
          <tr><th>Header 1</th><th>Header 2</th></tr>
          <tr><td>Data 1</td><td>Data 2</td></tr>
        </table>
        
        <h3>Subsection B.1</h3>
        <p>More content here.</p>
      </body>
    </html>
  `;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="html-textarea"]').fill(testHtml);
  });

  test('should handle different slide layout options', async ({ page }) => {
    // Test slide layout configuration
    // Requirements: 2.1, 2.2

    // Test standard layout
    await page.locator('[data-testid="slide-layout-select"]').selectOption('standard');
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });

    // Reset for next test
    await page.reload();
    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="html-textarea"]').fill(testHtml);

    // Test wide layout
    await page.locator('[data-testid="slide-layout-select"]').selectOption('wide');
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });

    // Reset for next test
    await page.reload();
    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="html-textarea"]').fill(testHtml);

    // Test custom layout
    await page.locator('[data-testid="slide-layout-select"]').selectOption('custom');
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });
  });

  test('should handle image inclusion options', async ({ page }) => {
    // Test image handling configuration
    // Requirements: 2.3

    // Test with images included
    await page.locator('[data-testid="include-images-checkbox"]').check();
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });

    // Reset and test without images
    await page.reload();
    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="html-textarea"]').fill(testHtml);
    
    await page.locator('[data-testid="include-images-checkbox"]').uncheck();
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });
  });

  test('should handle different theme options', async ({ page }) => {
    // Test theme selection
    // Requirements: 2.4

    const themes = ['default', 'professional', 'creative', 'minimal'];

    for (const theme of themes) {
      // Reset page for each theme test
      if (theme !== 'default') {
        await page.reload();
        await page.locator('[data-testid="html-input-tab"]').click();
        await page.locator('[data-testid="html-textarea"]').fill(testHtml);
      }

      await page.locator('[data-testid="theme-select"]').selectOption(theme);
      await page.locator('[data-testid="convert-button"]').click();
      await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should handle different section splitting strategies', async ({ page }) => {
    // Test section splitting configuration
    // Requirements: 2.5

    // Test split by H1
    await page.locator('[data-testid="split-strategy-select"]').selectOption('by-h1');
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });

    // Reset and test split by H2
    await page.reload();
    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="html-textarea"]').fill(testHtml);
    
    await page.locator('[data-testid="split-strategy-select"]').selectOption('by-h2');
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });

    // Reset and test no split
    await page.reload();
    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="html-textarea"]').fill(testHtml);
    
    await page.locator('[data-testid="split-strategy-select"]').selectOption('no-split');
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });

    // Reset and test custom selector
    await page.reload();
    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="html-textarea"]').fill(testHtml);
    
    await page.locator('[data-testid="split-strategy-select"]').selectOption('by-custom-selector');
    
    // Should show custom selector input
    await expect(page.locator('[data-testid="custom-selector-input"]')).toBeVisible();
    await page.locator('[data-testid="custom-selector-input"]').fill('h3');
    
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });
  });

  test('should use and reset default configuration', async ({ page }) => {
    // Test default configuration
    // Requirements: 2.6

    // Verify default values are set
    await expect(page.locator('[data-testid="slide-layout-select"]')).toHaveValue('standard');
    await expect(page.locator('[data-testid="include-images-checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue('default');
    await expect(page.locator('[data-testid="split-strategy-select"]')).toHaveValue('by-h2');

    // Change all settings
    await page.locator('[data-testid="slide-layout-select"]').selectOption('wide');
    await page.locator('[data-testid="include-images-checkbox"]').uncheck();
    await page.locator('[data-testid="theme-select"]').selectOption('professional');
    await page.locator('[data-testid="split-strategy-select"]').selectOption('by-h1');

    // Reset to defaults
    await page.locator('[data-testid="reset-defaults-button"]').click();

    // Verify defaults are restored
    await expect(page.locator('[data-testid="slide-layout-select"]')).toHaveValue('standard');
    await expect(page.locator('[data-testid="include-images-checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue('default');
    await expect(page.locator('[data-testid="split-strategy-select"]')).toHaveValue('by-h2');

    // Test conversion with defaults
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });
  });

  test('should handle complex configuration combinations', async ({ page }) => {
    // Test various configuration combinations
    // Requirements: All configuration requirements

    const configurations = [
      {
        layout: 'standard',
        images: true,
        theme: 'professional',
        split: 'by-h1'
      },
      {
        layout: 'wide',
        images: false,
        theme: 'creative',
        split: 'by-h2'
      },
      {
        layout: 'custom',
        images: true,
        theme: 'minimal',
        split: 'no-split'
      }
    ];

    for (let i = 0; i < configurations.length; i++) {
      const config = configurations[i];
      
      // Reset for each configuration
      if (i > 0) {
        await page.reload();
        await page.locator('[data-testid="html-input-tab"]').click();
        await page.locator('[data-testid="html-textarea"]').fill(testHtml);
      }

      // Apply configuration
      await page.locator('[data-testid="slide-layout-select"]').selectOption(config.layout);
      
      if (config.images) {
        await page.locator('[data-testid="include-images-checkbox"]').check();
      } else {
        await page.locator('[data-testid="include-images-checkbox"]').uncheck();
      }
      
      await page.locator('[data-testid="theme-select"]').selectOption(config.theme);
      await page.locator('[data-testid="split-strategy-select"]').selectOption(config.split);

      // Convert and verify
      await page.locator('[data-testid="convert-button"]').click();
      await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should persist configuration during session', async ({ page }) => {
    // Test configuration persistence
    // Requirements: 2.6

    // Set custom configuration
    await page.locator('[data-testid="slide-layout-select"]').selectOption('wide');
    await page.locator('[data-testid="theme-select"]').selectOption('professional');
    await page.locator('[data-testid="split-strategy-select"]').selectOption('by-h1');

    // Convert once
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });

    // Change HTML content and verify configuration persists
    const newHtml = '<html><body><h1>New Content</h1><p>Different content</p></body></html>';
    await page.locator('[data-testid="html-textarea"]').fill(newHtml);

    // Verify configuration is still set
    await expect(page.locator('[data-testid="slide-layout-select"]')).toHaveValue('wide');
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue('professional');
    await expect(page.locator('[data-testid="split-strategy-select"]')).toHaveValue('by-h1');

    // Convert again with same configuration
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });
  });
});