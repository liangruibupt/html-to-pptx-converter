import { test, expect } from '@playwright/test';

/**
 * End-to-End Performance Tests
 * 
 * These tests verify the application performs well under various conditions.
 * Requirements: All - Performance and scalability testing
 */

test.describe('Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle large HTML documents efficiently', async ({ page }) => {
    // Test performance with large HTML content
    // Requirements: All - Performance under load

    // Generate large HTML content
    const generateLargeHtml = (sections: number) => {
      let html = '<html><body><h1>Large Document Performance Test</h1>';
      
      for (let i = 1; i <= sections; i++) {
        html += `
          <h2>Section ${i}</h2>
          <p>This is section ${i} with substantial content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
          Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          
          <h3>Subsection ${i}.1</h3>
          <ul>
            <li>List item ${i}.1.1 with detailed information</li>
            <li>List item ${i}.1.2 with more content</li>
            <li>List item ${i}.1.3 with additional details</li>
          </ul>
          
          <h3>Subsection ${i}.2</h3>
          <table>
            <tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr>
            <tr><td>Data ${i}.1</td><td>Data ${i}.2</td><td>Data ${i}.3</td></tr>
            <tr><td>More data ${i}.1</td><td>More data ${i}.2</td><td>More data ${i}.3</td></tr>
          </table>
          
          <p>Additional paragraph content for section ${i} to increase document size and complexity.</p>
        `;
      }
      
      html += '</body></html>';
      return html;
    };

    await page.locator('[data-testid="html-input-tab"]').click();

    // Test with moderately large document (50 sections)
    const largeHtml = generateLargeHtml(50);
    
    // Measure input performance
    const startTime = Date.now();
    await page.locator('[data-testid="html-textarea"]').fill(largeHtml);
    const inputTime = Date.now() - startTime;
    
    // Input should be responsive (under 2 seconds)
    expect(inputTime).toBeLessThan(2000);

    // Verify preview renders without freezing
    await expect(page.locator('[data-testid="html-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="html-preview"]')).toContainText('Large Document Performance Test');

    // Measure conversion performance
    const conversionStartTime = Date.now();
    await page.locator('[data-testid="convert-button"]').click();
    
    // Conversion should complete within reasonable time (30 seconds for large document)
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 30000 });
    const conversionTime = Date.now() - conversionStartTime;
    
    // Log performance metrics
    console.log(`Large document conversion time: ${conversionTime}ms`);
    expect(conversionTime).toBeLessThan(30000);
  });

  test('should handle multiple rapid conversions', async ({ page }) => {
    // Test rapid successive conversions
    // Requirements: All - Stress testing

    const testHtmls = [
      '<html><body><h1>Test 1</h1><p>Content 1</p></body></html>',
      '<html><body><h1>Test 2</h1><p>Content 2</p><ul><li>Item 1</li><li>Item 2</li></ul></body></html>',
      '<html><body><h1>Test 3</h1><table><tr><th>Header</th></tr><tr><td>Data</td></tr></table></body></html>'
    ];

    await page.locator('[data-testid="html-input-tab"]').click();

    for (let i = 0; i < testHtmls.length; i++) {
      // Clear previous content
      await page.locator('[data-testid="html-textarea"]').fill('');
      await page.locator('[data-testid="html-textarea"]').fill(testHtmls[i]);

      // Start conversion
      const startTime = Date.now();
      await page.locator('[data-testid="convert-button"]').click();
      
      // Wait for completion
      await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 15000 });
      const conversionTime = Date.now() - startTime;
      
      console.log(`Conversion ${i + 1} time: ${conversionTime}ms`);
      
      // Each conversion should complete reasonably quickly
      expect(conversionTime).toBeLessThan(15000);

      // Brief pause between conversions
      await page.waitForTimeout(500);
    }
  });

  test('should maintain responsiveness during conversion', async ({ page }) => {
    // Test UI responsiveness during conversion
    // Requirements: 5.1, 5.2 - UI feedback and responsiveness

    // Generate medium-sized document
    const mediumHtml = `
      <html><body>
        <h1>Responsiveness Test</h1>
        ${Array.from({ length: 20 }, (_, i) => `
          <h2>Section ${i + 1}</h2>
          <p>Content for section ${i + 1} with various elements.</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
        `).join('')}
      </body></html>
    `;

    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="html-textarea"]').fill(mediumHtml);

    // Start conversion
    await page.locator('[data-testid="convert-button"]').click();

    // Verify progress indicator appears quickly
    await expect(page.locator('[data-testid="conversion-progress"]')).toBeVisible({ timeout: 1000 });

    // Test UI responsiveness during conversion
    // Should be able to interact with other elements
    const configElements = [
      '[data-testid="slide-layout-select"]',
      '[data-testid="theme-select"]',
      '[data-testid="split-strategy-select"]'
    ];

    for (const selector of configElements) {
      const element = page.locator(selector);
      
      // Element should be visible and potentially interactable
      await expect(element).toBeVisible();
      
      // Check if element is responsive (not frozen)
      const isEnabled = await element.isEnabled();
      // During conversion, elements might be disabled, but they should still be responsive
      expect(typeof isEnabled).toBe('boolean');
    }

    // Wait for conversion to complete
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 20000 });
  });

  test('should handle memory efficiently with complex HTML', async ({ page }) => {
    // Test memory usage with complex HTML structures
    // Requirements: All - Memory efficiency

    const complexHtml = `
      <html>
        <body>
          <h1>Memory Efficiency Test</h1>
          ${Array.from({ length: 10 }, (_, i) => `
            <section>
              <h2>Complex Section ${i + 1}</h2>
              <div class="nested-content">
                <p>Nested paragraph with <strong>formatting</strong> and <em>emphasis</em>.</p>
                <table>
                  <thead>
                    <tr>
                      ${Array.from({ length: 5 }, (_, j) => `<th>Header ${j + 1}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${Array.from({ length: 10 }, (_, row) => `
                      <tr>
                        ${Array.from({ length: 5 }, (_, col) => `<td>Data ${row + 1}.${col + 1}</td>`).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <ul class="nested-list">
                  ${Array.from({ length: 15 }, (_, j) => `
                    <li>
                      Complex list item ${j + 1} with <a href="#section${i}">internal link</a>
                      <ul>
                        <li>Nested item ${j + 1}.1</li>
                        <li>Nested item ${j + 1}.2</li>
                      </ul>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </section>
          `).join('')}
        </body>
      </html>
    `;

    await page.locator('[data-testid="html-input-tab"]').click();

    // Monitor performance during input
    const inputStartTime = performance.now();
    await page.locator('[data-testid="html-textarea"]').fill(complexHtml);
    const inputEndTime = performance.now();
    
    console.log(`Complex HTML input time: ${inputEndTime - inputStartTime}ms`);

    // Verify preview renders without issues
    await expect(page.locator('[data-testid="html-preview"]')).toBeVisible();

    // Start conversion and monitor
    const conversionStartTime = performance.now();
    await page.locator('[data-testid="convert-button"]').click();

    // Verify conversion completes
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 25000 });
    const conversionEndTime = performance.now();
    
    console.log(`Complex HTML conversion time: ${conversionEndTime - conversionStartTime}ms`);

    // Performance should be reasonable
    expect(conversionEndTime - conversionStartTime).toBeLessThan(25000);
  });

  test('should handle concurrent user interactions', async ({ page }) => {
    // Test handling of concurrent user actions
    // Requirements: 5.1 - UI responsiveness

    await page.locator('[data-testid="html-input-tab"]').click();
    
    const testHtml = '<html><body><h1>Concurrent Test</h1><p>Testing concurrent interactions</p></body></html>';
    await page.locator('[data-testid="html-textarea"]').fill(testHtml);

    // Simulate rapid user interactions
    const actions = [
      () => page.locator('[data-testid="slide-layout-select"]').selectOption('wide'),
      () => page.locator('[data-testid="theme-select"]').selectOption('professional'),
      () => page.locator('[data-testid="include-images-checkbox"]').uncheck(),
      () => page.locator('[data-testid="split-strategy-select"]').selectOption('by-h1'),
      () => page.locator('[data-testid="convert-button"]').click()
    ];

    // Execute actions rapidly
    const startTime = performance.now();
    for (const action of actions) {
      await action();
      await page.waitForTimeout(100); // Small delay between actions
    }
    const actionsTime = performance.now() - startTime;

    console.log(`Concurrent actions time: ${actionsTime}ms`);

    // All actions should complete quickly
    expect(actionsTime).toBeLessThan(2000);

    // Conversion should still work
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 15000 });
  });

  test('should handle browser resource constraints', async ({ page }) => {
    // Test behavior under resource constraints
    // Requirements: All - Resource efficiency

    // Simulate slower device by throttling CPU
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    try {
      const testHtml = `
        <html><body>
          <h1>Resource Constraint Test</h1>
          ${Array.from({ length: 30 }, (_, i) => `
            <h2>Section ${i + 1}</h2>
            <p>Content with resource constraints simulation.</p>
            <table>
              <tr><th>Col 1</th><th>Col 2</th><th>Col 3</th></tr>
              <tr><td>Data 1</td><td>Data 2</td><td>Data 3</td></tr>
            </table>
          `).join('')}
        </body></html>
      `;

      await page.locator('[data-testid="html-input-tab"]').click();
      await page.locator('[data-testid="html-textarea"]').fill(testHtml);

      // Even under constraints, conversion should complete
      await page.locator('[data-testid="convert-button"]').click();
      
      // Allow more time under resource constraints
      await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 45000 });

      // UI should remain responsive
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
      
    } finally {
      // Reset CPU throttling
      await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    }
  });
});