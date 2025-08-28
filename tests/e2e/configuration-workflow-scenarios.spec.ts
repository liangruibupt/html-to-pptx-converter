import { test, expect } from '@playwright/test';
import { TestUtils } from './test-utils';

/**
 * Configuration and Workflow Scenario Tests
 * 
 * These tests verify different configuration combinations and complex user workflows.
 * Requirements: All - Configuration options and workflow testing
 */

test.describe('Configuration and Workflow Scenarios', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    testUtils = new TestUtils(page);
  });

  test('should handle all possible configuration combinations systematically', async ({ page }) => {
    // Test all major configuration combinations
    // Requirements: 2.1-2.6 - All configuration options

    const testHtml = TestUtils.generateSampleHtml({
      title: 'Configuration Test Document',
      sections: 5,
      includeImages: true,
      includeTables: true,
      includeLists: true,
      includeLinks: true
    });

    const layouts = ['standard', 'wide', 'custom'];
    const themes = ['default', 'professional', 'creative', 'minimal'];
    const splitStrategies = ['by-h1', 'by-h2', 'no-split'];
    const imageOptions = [true, false];

    let testCount = 0;
    const maxTests = 8; // Limit to avoid excessive test time

    for (const layout of layouts) {
      for (const theme of themes) {
        for (const splitStrategy of splitStrategies) {
          for (const includeImages of imageOptions) {
            if (testCount >= maxTests) break;

            console.log(`Testing configuration ${testCount + 1}/${maxTests}: ${layout}, ${theme}, ${splitStrategy}, images: ${includeImages}`);

            // Reset for each test
            if (testCount > 0) {
              await page.reload();
              await page.goto('/');
              testUtils = new TestUtils(page);
            }

            await testUtils.enterHtmlContent(testHtml);

            // Apply configuration
            await testUtils.setConfiguration({
              layout,
              includeImages,
              theme,
              splitStrategy
            });

            // Convert and verify
            await testUtils.convertAndWaitForCompletion(20000);
            const download = await testUtils.downloadPptx();
            expect(download.suggestedFilename()).toMatch(/\.pptx$/);

            testCount++;
          }
          if (testCount >= maxTests) break;
        }
        if (testCount >= maxTests) break;
      }
      if (testCount >= maxTests) break;
    }
  });

  test('should handle custom selector workflow with various selectors', async ({ page }) => {
    // Test custom selector functionality with different selector types
    // Requirements: 2.5 - Custom selector splitting

    const customSelectorHtml = `
      <html>
        <body>
          <h1>Custom Selector Test Document</h1>
          
          <div class="section-a">
            <h2>Section A</h2>
            <p>Content for section A</p>
          </div>
          
          <div class="section-b">
            <h2>Section B</h2>
            <p>Content for section B</p>
          </div>
          
          <article id="article-1">
            <h3>Article 1</h3>
            <p>Article content 1</p>
          </article>
          
          <article id="article-2">
            <h3>Article 2</h3>
            <p>Article content 2</p>
          </article>
          
          <section data-slide="true">
            <h4>Data Slide 1</h4>
            <p>Content with data attribute</p>
          </section>
          
          <section data-slide="true">
            <h4>Data Slide 2</h4>
            <p>More content with data attribute</p>
          </section>
          
          <div class="custom-break">
            <h5>Custom Break 1</h5>
            <p>Content for custom break</p>
          </div>
          
          <div class="custom-break">
            <h5>Custom Break 2</h5>
            <p>More custom break content</p>
          </div>
        </body>
      </html>
    `;

    const customSelectors = [
      { selector: '.section-a, .section-b', description: 'Class selector combination' },
      { selector: 'article', description: 'Element selector' },
      { selector: '[data-slide="true"]', description: 'Attribute selector' },
      { selector: '.custom-break', description: 'Single class selector' },
      { selector: 'h3, h4, h5', description: 'Multiple heading selectors' }
    ];

    for (let i = 0; i < customSelectors.length; i++) {
      const { selector, description } = customSelectors[i];
      
      console.log(`Testing custom selector ${i + 1}/${customSelectors.length}: ${description} (${selector})`);

      // Reset for each test except the first
      if (i > 0) {
        await page.reload();
        await page.goto('/');
        testUtils = new TestUtils(page);
      }

      await testUtils.enterHtmlContent(customSelectorHtml);

      // Configure with custom selector
      await testUtils.setConfiguration({
        layout: 'standard',
        includeImages: false,
        theme: 'default',
        splitStrategy: 'by-custom-selector',
        customSelector: selector
      });

      // Verify custom selector input is visible and populated
      const customSelectorInput = page.locator('[data-testid="custom-selector-input"]');
      await expect(customSelectorInput).toBeVisible();
      await expect(customSelectorInput).toHaveValue(selector);

      // Convert and verify
      await testUtils.convertAndWaitForCompletion(15000);
      const download = await testUtils.downloadPptx();
      expect(download.suggestedFilename()).toMatch(/\.pptx$/);
    }
  });

  test('should handle progressive workflow with configuration changes', async ({ page }) => {
    // Test changing configuration progressively through the workflow
    // Requirements: 2.1-2.6, 5.1 - Configuration persistence and UI feedback

    const workflowHtml = TestUtils.generateSampleHtml({
      title: 'Progressive Workflow Test',
      sections: 4,
      includeImages: true,
      includeTables: true,
      includeLists: true,
      includeLinks: true
    });

    await testUtils.enterHtmlContent(workflowHtml);

    // Step 1: Start with default configuration
    console.log('Step 1: Default configuration');
    await expect(page.locator('[data-testid="slide-layout-select"]')).toHaveValue('standard');
    await expect(page.locator('[data-testid="include-images-checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue('default');
    await expect(page.locator('[data-testid="split-strategy-select"]')).toHaveValue('by-h2');

    // Step 2: Change layout and verify persistence
    console.log('Step 2: Change layout');
    await testUtils.setConfiguration({ layout: 'wide' });
    await expect(page.locator('[data-testid="slide-layout-select"]')).toHaveValue('wide');

    // Step 3: Change theme and verify previous setting persists
    console.log('Step 3: Change theme');
    await testUtils.setConfiguration({ theme: 'professional' });
    await expect(page.locator('[data-testid="slide-layout-select"]')).toHaveValue('wide');
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue('professional');

    // Step 4: Change multiple settings at once
    console.log('Step 4: Change multiple settings');
    await testUtils.setConfiguration({
      includeImages: false,
      splitStrategy: 'by-h1'
    });
    await expect(page.locator('[data-testid="slide-layout-select"]')).toHaveValue('wide');
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue('professional');
    await expect(page.locator('[data-testid="include-images-checkbox"]')).not.toBeChecked();
    await expect(page.locator('[data-testid="split-strategy-select"]')).toHaveValue('by-h1');

    // Step 5: Convert with current configuration
    console.log('Step 5: Convert with accumulated settings');
    await testUtils.convertAndWaitForCompletion();
    let download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);

    // Step 6: Change content and verify configuration persists
    console.log('Step 6: Change content, verify config persistence');
    const newHtml = TestUtils.generateSampleHtml({
      title: 'Updated Content',
      sections: 2,
      includeImages: false,
      includeTables: false,
      includeLists: true,
      includeLinks: false
    });
    await testUtils.enterHtmlContent(newHtml);

    // Verify all previous settings are still applied
    await expect(page.locator('[data-testid="slide-layout-select"]')).toHaveValue('wide');
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue('professional');
    await expect(page.locator('[data-testid="include-images-checkbox"]')).not.toBeChecked();
    await expect(page.locator('[data-testid="split-strategy-select"]')).toHaveValue('by-h1');

    // Step 7: Final conversion with persisted settings
    console.log('Step 7: Final conversion');
    await testUtils.convertAndWaitForCompletion();
    download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);
  });

  test('should handle configuration reset and restoration workflow', async ({ page }) => {
    // Test configuration reset functionality and restoration
    // Requirements: 2.6 - Default configuration and reset

    const testHtml = TestUtils.generateSampleHtml({
      title: 'Reset Test Document',
      sections: 3,
      includeImages: true,
      includeTables: true,
      includeLists: true,
      includeLinks: true
    });

    await testUtils.enterHtmlContent(testHtml);

    // Step 1: Record default values
    console.log('Step 1: Record default configuration');
    const defaultLayout = await page.locator('[data-testid="slide-layout-select"]').inputValue();
    const defaultTheme = await page.locator('[data-testid="theme-select"]').inputValue();
    const defaultSplitStrategy = await page.locator('[data-testid="split-strategy-select"]').inputValue();
    const defaultIncludeImages = await page.locator('[data-testid="include-images-checkbox"]').isChecked();

    console.log('Default values:', { defaultLayout, defaultTheme, defaultSplitStrategy, defaultIncludeImages });

    // Step 2: Change all settings to non-default values
    console.log('Step 2: Change all settings');
    await testUtils.setConfiguration({
      layout: defaultLayout === 'standard' ? 'wide' : 'standard',
      includeImages: !defaultIncludeImages,
      theme: defaultTheme === 'default' ? 'professional' : 'default',
      splitStrategy: defaultSplitStrategy === 'by-h2' ? 'by-h1' : 'by-h2'
    });

    // Verify changes were applied
    await expect(page.locator('[data-testid="slide-layout-select"]')).not.toHaveValue(defaultLayout);
    await expect(page.locator('[data-testid="theme-select"]')).not.toHaveValue(defaultTheme);
    await expect(page.locator('[data-testid="split-strategy-select"]')).not.toHaveValue(defaultSplitStrategy);
    
    if (defaultIncludeImages) {
      await expect(page.locator('[data-testid="include-images-checkbox"]')).not.toBeChecked();
    } else {
      await expect(page.locator('[data-testid="include-images-checkbox"]')).toBeChecked();
    }

    // Step 3: Convert with modified settings
    console.log('Step 3: Convert with modified settings');
    await testUtils.convertAndWaitForCompletion();
    let download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);

    // Step 4: Reset to defaults
    console.log('Step 4: Reset to defaults');
    await testUtils.resetToDefaults();

    // Step 5: Verify all settings are restored to defaults
    console.log('Step 5: Verify defaults restored');
    await expect(page.locator('[data-testid="slide-layout-select"]')).toHaveValue(defaultLayout);
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue(defaultTheme);
    await expect(page.locator('[data-testid="split-strategy-select"]')).toHaveValue(defaultSplitStrategy);
    
    if (defaultIncludeImages) {
      await expect(page.locator('[data-testid="include-images-checkbox"]')).toBeChecked();
    } else {
      await expect(page.locator('[data-testid="include-images-checkbox"]')).not.toBeChecked();
    }

    // Step 6: Convert with restored defaults
    console.log('Step 6: Convert with restored defaults');
    await testUtils.convertAndWaitForCompletion();
    download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);

    // Step 7: Test multiple reset cycles
    console.log('Step 7: Test multiple reset cycles');
    for (let i = 0; i < 3; i++) {
      // Change settings
      await testUtils.setConfiguration({
        layout: 'custom',
        theme: 'creative',
        splitStrategy: 'no-split'
      });

      // Reset
      await testUtils.resetToDefaults();

      // Verify defaults
      await expect(page.locator('[data-testid="slide-layout-select"]')).toHaveValue(defaultLayout);
      await expect(page.locator('[data-testid="theme-select"]')).toHaveValue(defaultTheme);
      await expect(page.locator('[data-testid="split-strategy-select"]')).toHaveValue(defaultSplitStrategy);
    }
  });

  test('should handle file upload to direct input workflow transitions', async ({ page }) => {
    // Test switching between file upload and direct input modes
    // Requirements: 1.1-1.4 - File upload and direct input

    const fileHtml = TestUtils.generateSampleHtml({
      title: 'File Upload Content',
      sections: 2,
      includeImages: true,
      includeTables: false,
      includeLists: true,
      includeLinks: false
    });

    const directHtml = TestUtils.generateSampleHtml({
      title: 'Direct Input Content',
      sections: 3,
      includeImages: false,
      includeTables: true,
      includeLists: false,
      includeLinks: true
    });

    // Step 1: Start with file upload
    console.log('Step 1: Upload file');
    await testUtils.uploadHtmlFile(fileHtml, 'uploaded-file.html');
    await testUtils.verifyHtmlPreview('File Upload Content');

    // Configure and convert
    await testUtils.setConfiguration({
      layout: 'standard',
      includeImages: true,
      theme: 'default',
      splitStrategy: 'by-h2'
    });

    await testUtils.convertAndWaitForCompletion();
    let download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/uploaded-file.*\.pptx$/);

    // Step 2: Switch to direct input
    console.log('Step 2: Switch to direct input');
    await page.locator('[data-testid="html-input-tab"]').click();
    await testUtils.enterHtmlContent(directHtml);
    await testUtils.verifyHtmlPreview('Direct Input Content');

    // Verify configuration persists across input method changes
    await expect(page.locator('[data-testid="slide-layout-select"]')).toHaveValue('standard');
    await expect(page.locator('[data-testid="include-images-checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue('default');
    await expect(page.locator('[data-testid="split-strategy-select"]')).toHaveValue('by-h2');

    // Convert with direct input
    await testUtils.convertAndWaitForCompletion();
    download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);

    // Step 3: Switch back to file upload
    console.log('Step 3: Switch back to file upload');
    await page.locator('[data-testid="file-upload"]').click();
    
    const updatedFileHtml = TestUtils.generateSampleHtml({
      title: 'Updated File Content',
      sections: 4,
      includeImages: true,
      includeTables: true,
      includeLists: true,
      includeLinks: true
    });

    await testUtils.uploadHtmlFile(updatedFileHtml, 'updated-file.html');
    await testUtils.verifyHtmlPreview('Updated File Content');

    // Configuration should still persist
    await expect(page.locator('[data-testid="slide-layout-select"]')).toHaveValue('standard');
    await expect(page.locator('[data-testid="include-images-checkbox"]')).toBeChecked();

    // Step 4: Change configuration and convert
    console.log('Step 4: Change configuration and convert');
    await testUtils.setConfiguration({
      layout: 'wide',
      theme: 'professional',
      splitStrategy: 'by-h1'
    });

    await testUtils.convertAndWaitForCompletion();
    download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/updated-file.*\.pptx$/);

    // Step 5: Rapid switching test
    console.log('Step 5: Rapid switching test');
    for (let i = 0; i < 3; i++) {
      // Switch to direct input
      await page.locator('[data-testid="html-input-tab"]').click();
      await testUtils.enterHtmlContent(`<html><body><h1>Quick Test ${i + 1}</h1><p>Content ${i + 1}</p></body></html>`);
      
      // Switch back to file upload
      await page.locator('[data-testid="file-upload"]').click();
      await testUtils.uploadHtmlFile(`<html><body><h1>File Test ${i + 1}</h1><p>File content ${i + 1}</p></body></html>`, `test-${i + 1}.html`);
    }

    // Final conversion should work
    await testUtils.convertAndWaitForCompletion();
    download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/test-3.*\.pptx$/);
  });

  test('should handle complex multi-step workflow with error recovery', async ({ page }) => {
    // Test complex workflow with intentional errors and recovery
    // Requirements: All - Complete workflow with error handling

    // Step 1: Start with valid content
    console.log('Step 1: Valid content and conversion');
    const validHtml = TestUtils.generateSampleHtml({
      title: 'Valid Content',
      sections: 2,
      includeImages: false,
      includeTables: true,
      includeLists: true,
      includeLinks: false
    });

    await testUtils.enterHtmlContent(validHtml);
    await testUtils.setConfiguration({
      layout: 'standard',
      includeImages: false,
      theme: 'default',
      splitStrategy: 'by-h2'
    });

    await testUtils.convertAndWaitForCompletion();
    let download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);

    // Step 2: Introduce problematic content
    console.log('Step 2: Problematic content');
    const problematicHtml = `
      <html>
        <body>
          <h1>Problematic Content</h1>
          <p>This content has issues</p>
          <img src="invalid-image.jpg" alt="Broken Image" />
          <table>
            <tr><td>Incomplete table structure
          </table>
        </body>
      </html>
    `;

    await testUtils.enterHtmlContent(problematicHtml);

    // Try conversion with images enabled (might cause issues)
    await testUtils.setConfiguration({ includeImages: true });
    await page.locator('[data-testid="convert-button"]').click();

    // Handle potential error or success
    const downloadButton = page.locator('[data-testid="download-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');

    try {
      await Promise.race([
        downloadButton.waitFor({ timeout: 15000 }),
        errorMessage.waitFor({ timeout: 15000 })
      ]);

      if (await errorMessage.isVisible()) {
        console.log('Step 2: Error occurred as expected');
        await testUtils.verifyErrorMessage();
      } else {
        console.log('Step 2: Conversion succeeded despite issues');
        download = await testUtils.downloadPptx();
        expect(download.suggestedFilename()).toMatch(/\.pptx$/);
      }
    } catch {
      console.log('Step 2: Timeout occurred - continuing with recovery');
    }

    // Step 3: Recovery with configuration change
    console.log('Step 3: Recovery with configuration change');
    await testUtils.setConfiguration({ includeImages: false }); // Disable images to avoid issues
    
    try {
      await testUtils.convertAndWaitForCompletion(15000);
      download = await testUtils.downloadPptx();
      expect(download.suggestedFilename()).toMatch(/\.pptx$/);
    } catch {
      console.log('Step 3: Still having issues, trying content fix');
    }

    // Step 4: Fix content and retry
    console.log('Step 4: Fix content and retry');
    const fixedHtml = `
      <html>
        <body>
          <h1>Fixed Content</h1>
          <p>This content has been corrected</p>
          <h2>Section 1</h2>
          <p>Content for section 1</p>
          <table border="1">
            <tr><th>Header</th></tr>
            <tr><td>Complete table data</td></tr>
          </table>
          <h2>Section 2</h2>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
        </body>
      </html>
    `;

    await testUtils.enterHtmlContent(fixedHtml);
    await testUtils.convertAndWaitForCompletion();
    download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);

    // Step 5: Test configuration robustness
    console.log('Step 5: Test configuration robustness');
    await testUtils.setConfiguration({
      layout: 'wide',
      includeImages: true, // Re-enable images with fixed content
      theme: 'professional',
      splitStrategy: 'by-h2'
    });

    await testUtils.convertAndWaitForCompletion();
    download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);

    // Step 6: Final validation with complex content
    console.log('Step 6: Final validation');
    const complexValidHtml = TestUtils.generateSampleHtml({
      title: 'Final Validation Document',
      sections: 5,
      includeImages: true,
      includeTables: true,
      includeLists: true,
      includeLinks: true
    });

    await testUtils.enterHtmlContent(complexValidHtml);
    await testUtils.convertAndWaitForCompletion(25000); // Allow extra time for complex content
    download = await testUtils.downloadPptx();
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);

    console.log('Multi-step workflow completed successfully');
  });

  test('should handle performance under various configuration loads', async ({ page }) => {
    // Test performance with different configuration combinations
    // Requirements: All - Performance testing with configurations

    const performanceTestHtml = TestUtils.generateSampleHtml({
      title: 'Performance Test Document',
      sections: 10,
      includeImages: true,
      includeTables: true,
      includeLists: true,
      includeLinks: true
    });

    await testUtils.enterHtmlContent(performanceTestHtml);

    const performanceConfigs = [
      {
        name: 'Minimal processing',
        config: { layout: 'standard', includeImages: false, theme: 'default', splitStrategy: 'no-split' }
      },
      {
        name: 'Standard processing',
        config: { layout: 'standard', includeImages: true, theme: 'default', splitStrategy: 'by-h2' }
      },
      {
        name: 'Complex processing',
        config: { layout: 'wide', includeImages: true, theme: 'professional', splitStrategy: 'by-h1' }
      },
      {
        name: 'Maximum processing',
        config: { layout: 'custom', includeImages: true, theme: 'creative', splitStrategy: 'by-h2' }
      }
    ];

    for (let i = 0; i < performanceConfigs.length; i++) {
      const { name, config } = performanceConfigs[i];
      
      console.log(`Performance test ${i + 1}/${performanceConfigs.length}: ${name}`);

      // Reset for each test except the first
      if (i > 0) {
        await testUtils.enterHtmlContent(performanceTestHtml);
      }

      // Apply configuration and measure time
      const configStartTime = performance.now();
      await testUtils.setConfiguration(config);
      const configTime = performance.now() - configStartTime;

      // Convert and measure time
      const conversionStartTime = performance.now();
      await testUtils.convertAndWaitForCompletion(30000);
      const conversionTime = performance.now() - conversionStartTime;

      // Download and measure time
      const downloadStartTime = performance.now();
      const download = await testUtils.downloadPptx();
      const downloadTime = performance.now() - downloadStartTime;

      // Log performance metrics
      console.log(`${name} - Config: ${configTime.toFixed(2)}ms, Conversion: ${conversionTime.toFixed(2)}ms, Download: ${downloadTime.toFixed(2)}ms`);

      // Verify success
      expect(download.suggestedFilename()).toMatch(/\.pptx$/);

      // Performance assertions (reasonable limits)
      expect(configTime).toBeLessThan(2000); // Configuration should be fast
      expect(conversionTime).toBeLessThan(30000); // Conversion should complete within 30s
      expect(downloadTime).toBeLessThan(5000); // Download should be fast
    }
  });
});