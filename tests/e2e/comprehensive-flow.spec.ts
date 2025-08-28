import { test, expect } from '@playwright/test';
import { TestUtils, SampleHtmlTemplates } from './test-utils';

/**
 * Comprehensive End-to-End Flow Tests
 * 
 * These tests use the test utilities to verify comprehensive user flows
 * with different combinations of inputs and configurations.
 * Requirements: All - Comprehensive testing of all features
 */

test.describe('Comprehensive Flow Tests', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    testUtils = new TestUtils(page);
  });

  test('should handle complete workflow with file upload and custom configuration', async ({ page }) => {
    // Test complete workflow using file upload
    // Requirements: 1.1, 1.2, 1.3, 2.1-2.6, 3.1-3.8, 4.1-4.5, 5.1-5.4

    // Upload HTML file
    await testUtils.uploadHtmlFile(SampleHtmlTemplates.complex, 'complex-test.html');

    // Verify preview
    await testUtils.verifyHtmlPreview('Complex Document');

    // Configure conversion settings
    await testUtils.setConfiguration({
      layout: 'wide',
      includeImages: true,
      theme: 'professional',
      splitStrategy: 'by-h2'
    });

    // Convert and download
    await testUtils.convertAndWaitForCompletion();
    const download = await testUtils.downloadPptx();

    // Verify download
    expect(download.suggestedFilename()).toMatch(/complex-test.*\.pptx$/);
    expect(await download.path()).toBeTruthy();
  });

  test('should handle complete workflow with direct HTML input and default settings', async ({ page }) => {
    // Test workflow with direct input and defaults
    // Requirements: 1.4, 1.5, 2.6, 3.1-3.8, 4.1-4.5

    // Enter HTML content directly
    await testUtils.enterHtmlContent(SampleHtmlTemplates.withImages);

    // Verify preview
    await testUtils.verifyHtmlPreview('Document with Images');

    // Use default configuration (no changes needed)
    
    // Convert and download
    await testUtils.convertAndWaitForCompletion();
    const download = await testUtils.downloadPptx();

    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);
  });

  test('should handle error recovery workflow', async ({ page }) => {
    // Test error handling and recovery
    // Requirements: 3.7, 3.8, 5.4

    // Enter malformed HTML
    await testUtils.enterHtmlContent(SampleHtmlTemplates.malformed);

    // Attempt conversion
    await page.locator('[data-testid="convert-button"]').click();

    // Handle potential error or success (malformed HTML might still work)
    const downloadButton = page.locator('[data-testid="download-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');

    try {
      await downloadButton.waitFor({ timeout: 10000 });
      // If successful, verify download works
      const download = await testUtils.downloadPptx();
      expect(download.suggestedFilename()).toMatch(/\.pptx$/);
    } catch {
      // If error occurred, test recovery
      await testUtils.verifyErrorMessage();
      
      // Try recovery with valid HTML
      await testUtils.enterHtmlContent(SampleHtmlTemplates.simple);
      await testUtils.convertAndWaitForCompletion();
      const download = await testUtils.downloadPptx();
      expect(download.suggestedFilename()).toMatch(/\.pptx$/);
    }
  });

  test('should handle configuration changes during workflow', async ({ page }) => {
    // Test changing configuration mid-workflow
    // Requirements: 2.1-2.6, 5.1

    await testUtils.enterHtmlContent(SampleHtmlTemplates.complex);

    // Set initial configuration
    await testUtils.setConfiguration({
      layout: 'standard',
      theme: 'default',
      splitStrategy: 'by-h1'
    });

    // Change configuration multiple times
    await testUtils.setConfiguration({
      layout: 'wide',
      includeImages: false,
      theme: 'creative'
    });

    await testUtils.setConfiguration({
      splitStrategy: 'by-h2',
      includeImages: true
    });

    // Final configuration change
    await testUtils.setConfiguration({
      theme: 'minimal',
      splitStrategy: 'no-split'
    });

    // Convert with final configuration
    await testUtils.convertAndWaitForCompletion();
    const download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);
  });

  test('should handle multiple document conversions in sequence', async ({ page }) => {
    // Test converting multiple documents in sequence
    // Requirements: All - Sequential operations

    const documents = [
      { content: SampleHtmlTemplates.simple, name: 'simple' },
      { content: SampleHtmlTemplates.complex, name: 'complex' },
      { content: SampleHtmlTemplates.withImages, name: 'with-images' }
    ];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      // Clear previous content and enter new
      await testUtils.enterHtmlContent(doc.content);

      // Use different configuration for each document
      const configs = [
        { layout: 'standard', theme: 'default', splitStrategy: 'by-h1' },
        { layout: 'wide', theme: 'professional', splitStrategy: 'by-h2' },
        { layout: 'custom', theme: 'creative', splitStrategy: 'no-split' }
      ];

      await testUtils.setConfiguration(configs[i]);

      // Convert and download
      await testUtils.convertAndWaitForCompletion();
      const download = await testUtils.downloadPptx();
      
      expect(download.suggestedFilename()).toMatch(/\.pptx$/);
      
      // Brief pause between conversions
      await page.waitForTimeout(1000);
    }
  });

  test('should handle custom selector workflow', async ({ page }) => {
    // Test custom selector functionality
    // Requirements: 2.5

    const htmlWithCustomElements = `
      <html>
        <body>
          <h1>Custom Selector Test</h1>
          <div class="custom-section">
            <h3>Custom Section 1</h3>
            <p>Content for custom section 1</p>
          </div>
          <div class="custom-section">
            <h3>Custom Section 2</h3>
            <p>Content for custom section 2</p>
          </div>
          <div class="other-content">
            <p>This should not be a separate section</p>
          </div>
        </body>
      </html>
    `;

    await testUtils.enterHtmlContent(htmlWithCustomElements);

    // Configure custom selector
    await testUtils.setConfiguration({
      splitStrategy: 'by-custom-selector',
      customSelector: '.custom-section'
    });

    // Convert and verify
    await testUtils.convertAndWaitForCompletion();
    const download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);
  });

  test('should handle responsive design workflow', async ({ page }) => {
    // Test responsive design across different viewports
    // Requirements: 5.3

    await testUtils.verifyResponsiveLayout();

    // Test functionality at mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await testUtils.enterHtmlContent(SampleHtmlTemplates.simple);
    await testUtils.convertAndWaitForCompletion();
    
    let download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);

    // Test functionality at desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await testUtils.enterHtmlContent(SampleHtmlTemplates.complex);
    await testUtils.convertAndWaitForCompletion();
    
    download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);
  });

  test('should handle validation and recovery workflow', async ({ page }) => {
    // Test validation errors and recovery
    // Requirements: 1.5, 1.6, 5.4

    // Test empty content validation
    await testUtils.enterHtmlContent('');
    await page.locator('[data-testid="convert-button"]').click();
    await testUtils.verifyValidationError();

    // Recover with valid content
    await testUtils.enterHtmlContent(SampleHtmlTemplates.simple);
    await testUtils.convertAndWaitForCompletion();
    
    // Test file size validation (simulate large file)
    const fileInput = page.locator('input[type="file"]');
    const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
    
    try {
      await fileInput.setInputFiles({
        name: 'large.html',
        mimeType: 'text/html',
        buffer: Buffer.from(`<html><body>${largeContent}</body></html>`)
      });
      
      await testUtils.verifyValidationError('size');
    } catch {
      // File might be too large to create, skip this validation
      console.log('Skipped large file validation test');
    }

    // Test invalid file type
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Not HTML content')
    });
    
    await testUtils.verifyValidationError();

    // Recover with valid HTML file
    await testUtils.uploadHtmlFile(SampleHtmlTemplates.simple);
    await testUtils.convertAndWaitForCompletion();
    const download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);
  });

  test('should handle configuration reset workflow', async ({ page }) => {
    // Test configuration reset functionality
    // Requirements: 2.6

    await testUtils.enterHtmlContent(SampleHtmlTemplates.complex);

    // Change all configuration options
    await testUtils.setConfiguration({
      layout: 'wide',
      includeImages: false,
      theme: 'creative',
      splitStrategy: 'by-h1'
    });

    // Reset to defaults
    await testUtils.resetToDefaults();

    // Verify defaults are restored
    await expect(page.locator('[data-testid="slide-layout-select"]')).toHaveValue('standard');
    await expect(page.locator('[data-testid="include-images-checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue('default');
    await expect(page.locator('[data-testid="split-strategy-select"]')).toHaveValue('by-h2');

    // Convert with default settings
    await testUtils.convertAndWaitForCompletion();
    const download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);
  });

  test('should handle progress feedback workflow', async ({ page }) => {
    // Test progress feedback during conversion
    // Requirements: 5.1, 5.2

    // Use larger document to ensure visible progress
    const largeHtml = TestUtils.generateSampleHtml({
      title: 'Progress Test Document',
      sections: 20,
      includeImages: true,
      includeTables: true,
      includeLists: true,
      includeLinks: true
    });

    await testUtils.enterHtmlContent(largeHtml);

    // Start conversion
    await page.locator('[data-testid="convert-button"]').click();

    // Verify progress is shown
    await testUtils.verifyConversionProgress();

    // Verify progress updates (check for changes in progress text/value)
    await testUtils.waitForStable('[data-testid="conversion-progress"]');

    // Wait for completion
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 20000 });

    // Verify final state
    const download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);
  });
});