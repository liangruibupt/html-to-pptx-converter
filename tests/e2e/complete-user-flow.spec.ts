import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for Complete User Flow
 * 
 * These tests verify the complete user journey from HTML input to PPTX download.
 * Requirements: All - Tests the entire application flow
 */

test.describe('Complete User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full conversion flow with file upload', async ({ page }) => {
    // Test HTML file upload flow
    // Requirements: 1.1, 1.2, 1.3

    // Check initial state
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-upload"]')).toBeVisible();

    // Create a test HTML file
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head><title>Test Document</title></head>
        <body>
          <h1>Main Title</h1>
          <p>This is a <strong>test</strong> paragraph with <em>formatting</em>.</p>
          <h2>Section 1</h2>
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
    `;

    // Upload HTML file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.html',
      mimeType: 'text/html',
      buffer: Buffer.from(htmlContent)
    });

    // Verify HTML preview appears
    await expect(page.locator('[data-testid="html-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="html-preview"]')).toContainText('Main Title');

    // Configure conversion settings
    // Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
    
    // Select slide layout
    await page.locator('[data-testid="slide-layout-select"]').selectOption('standard');
    
    // Configure image handling
    await page.locator('[data-testid="include-images-checkbox"]').check();
    
    // Select theme
    await page.locator('[data-testid="theme-select"]').selectOption('professional');
    
    // Configure section splitting
    await page.locator('[data-testid="split-strategy-select"]').selectOption('by-h2');

    // Start conversion
    // Requirements: 3.1, 5.2
    await page.locator('[data-testid="convert-button"]').click();

    // Verify conversion progress is shown
    await expect(page.locator('[data-testid="conversion-progress"]')).toBeVisible();
    
    // Wait for conversion to complete
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });

    // Verify download functionality
    // Requirements: 4.1, 4.2, 4.3
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="download-button"]').click();
    const download = await downloadPromise;

    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);
    expect(await download.path()).toBeTruthy();
  });

  test('should complete full conversion flow with direct HTML input', async ({ page }) => {
    // Test direct HTML input flow
    // Requirements: 1.4, 1.5

    // Switch to HTML input mode
    await page.locator('[data-testid="html-input-tab"]').click();
    
    // Enter HTML content
    const htmlContent = `
      <h1>Direct Input Test</h1>
      <p>This content was entered directly.</p>
      <h2>Features</h2>
      <ol>
        <li>Direct HTML input</li>
        <li>Real-time preview</li>
        <li>Instant conversion</li>
      </ol>
    `;
    
    await page.locator('[data-testid="html-textarea"]').fill(htmlContent);

    // Verify preview updates
    await expect(page.locator('[data-testid="html-preview"]')).toContainText('Direct Input Test');

    // Use default configuration and convert
    await page.locator('[data-testid="convert-button"]').click();

    // Wait for conversion and download
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });
    
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="download-button"]').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pptx$/);
  });

  test('should handle conversion errors gracefully', async ({ page }) => {
    // Test error handling
    // Requirements: 3.7, 3.8, 5.4

    // Enter invalid HTML
    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="html-textarea"]').fill('<invalid><html><content>');

    // Attempt conversion
    await page.locator('[data-testid="convert-button"]').click();

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('conversion');

    // Verify recovery options
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should validate file uploads correctly', async ({ page }) => {
    // Test file validation
    // Requirements: 1.5, 1.6

    // Try to upload non-HTML file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is not HTML')
    });

    // Verify validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('HTML');

    // Try to upload oversized file
    const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
    await fileInput.setInputFiles({
      name: 'large.html',
      mimeType: 'text/html',
      buffer: Buffer.from(`<html><body>${largeContent}</body></html>`)
    });

    // Verify size validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('size');
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test responsive design
    // Requirements: 5.3

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
    
    // Verify mobile-friendly layout
    const container = page.locator('[data-testid="app-container"]');
    const boundingBox = await container.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
  });
});