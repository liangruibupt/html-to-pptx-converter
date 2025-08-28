import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for Different HTML Input Variations
 * 
 * These tests verify the application handles various HTML content types correctly.
 * Requirements: All - Tests different HTML inputs and edge cases
 */

test.describe('HTML Input Variations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Switch to HTML input mode for direct testing
    await page.locator('[data-testid="html-input-tab"]').click();
  });

  test('should handle complex HTML with nested elements', async ({ page }) => {
    // Test complex HTML structure
    // Requirements: 3.2, 3.3, 3.5, 3.6

    const complexHtml = `
      <html>
        <head><title>Complex Document</title></head>
        <body>
          <h1>Complex HTML Document</h1>
          <div class="intro">
            <p>This document contains <strong>nested</strong> and <em>complex</em> elements.</p>
          </div>
          
          <h2>Nested Lists</h2>
          <ul>
            <li>Top level item
              <ul>
                <li>Nested item 1</li>
                <li>Nested item 2 with <a href="https://example.com">link</a></li>
              </ul>
            </li>
            <li>Another top level item</li>
          </ul>

          <h2>Complex Table</h2>
          <table border="1">
            <thead>
              <tr>
                <th colspan="2">Header Spanning Two Columns</th>
                <th>Single Header</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Bold Cell</strong></td>
                <td><em>Italic Cell</em></td>
                <td><a href="https://test.com">Link Cell</a></td>
              </tr>
              <tr>
                <td>Regular cell</td>
                <td>Another cell</td>
                <td>Third cell</td>
              </tr>
            </tbody>
          </table>

          <h2>Mixed Content</h2>
          <p>Paragraph with <code>inline code</code> and <mark>highlighted text</mark>.</p>
          <blockquote>
            <p>This is a blockquote with <strong>formatting</strong>.</p>
          </blockquote>
        </body>
      </html>
    `;

    await page.locator('[data-testid="html-textarea"]').fill(complexHtml);

    // Verify preview renders complex content
    await expect(page.locator('[data-testid="html-preview"]')).toContainText('Complex HTML Document');
    await expect(page.locator('[data-testid="html-preview"]')).toContainText('Nested item 1');

    // Convert and verify success
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 15000 });
  });

  test('should handle HTML with images and media', async ({ page }) => {
    // Test HTML with images
    // Requirements: 2.3, 3.3

    const htmlWithImages = `
      <html>
        <body>
          <h1>Document with Images</h1>
          <p>This document contains various image types:</p>
          
          <h2>Base64 Image</h2>
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwNzNlNiIvPgogIDx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VGVzdDwvdGV4dD4KICA8L3N2Zz4K" alt="Test SVG" />
          
          <h2>External Image Reference</h2>
          <img src="https://via.placeholder.com/150x100/0073e6/ffffff?text=Placeholder" alt="Placeholder" />
          
          <p>Images should be handled according to configuration settings.</p>
        </body>
      </html>
    `;

    await page.locator('[data-testid="html-textarea"]').fill(htmlWithImages);

    // Configure to include images
    await page.locator('[data-testid="include-images-checkbox"]').check();

    // Convert and verify
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 15000 });

    // Test excluding images
    await page.locator('[data-testid="include-images-checkbox"]').uncheck();
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 15000 });
  });

  test('should handle HTML with various text formatting', async ({ page }) => {
    // Test text formatting preservation
    // Requirements: 3.2

    const formattedHtml = `
      <html>
        <body>
          <h1>Text Formatting Test</h1>
          
          <h2>Basic Formatting</h2>
          <p>This paragraph contains <strong>bold text</strong>, <em>italic text</em>, 
             <u>underlined text</u>, and <del>strikethrough text</del>.</p>
          
          <h3>Nested Formatting</h3>
          <p><strong>Bold with <em>nested italic</em> text</strong></p>
          <p><em>Italic with <strong>nested bold</strong> text</em></p>
          
          <h4>Code and Preformatted</h4>
          <p>Inline <code>code snippet</code> in paragraph.</p>
          <pre>
            Preformatted text
            with multiple lines
            and    spacing
          </pre>
          
          <h5>Subscript and Superscript</h5>
          <p>Water is H<sub>2</sub>O and E=mc<sup>2</sup></p>
          
          <h6>Small Heading</h6>
          <p><small>Small text</small> and <mark>highlighted text</mark></p>
        </body>
      </html>
    `;

    await page.locator('[data-testid="html-textarea"]').fill(formattedHtml);

    // Verify preview shows formatting
    await expect(page.locator('[data-testid="html-preview"]')).toContainText('Text Formatting Test');

    // Convert and verify
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 15000 });
  });

  test('should handle HTML with links and navigation', async ({ page }) => {
    // Test hyperlink preservation
    // Requirements: 3.6

    const htmlWithLinks = `
      <html>
        <body>
          <h1>Links and Navigation</h1>
          
          <h2>External Links</h2>
          <p>Visit <a href="https://www.example.com">Example.com</a> for more information.</p>
          <p>Email us at <a href="mailto:test@example.com">test@example.com</a></p>
          
          <h2>Internal Links</h2>
          <p>Go to <a href="#section1">Section 1</a> or <a href="#section2">Section 2</a></p>
          
          <h2 id="section1">Section 1</h2>
          <p>This is section 1 content with a <a href="https://github.com">GitHub link</a>.</p>
          
          <h2 id="section2">Section 2</h2>
          <p>This is section 2 content.</p>
          
          <h2>Link Lists</h2>
          <ul>
            <li><a href="https://google.com">Google</a></li>
            <li><a href="https://microsoft.com">Microsoft</a></li>
            <li><a href="https://apple.com">Apple</a></li>
          </ul>
        </body>
      </html>
    `;

    await page.locator('[data-testid="html-textarea"]').fill(htmlWithLinks);

    // Verify preview shows links
    await expect(page.locator('[data-testid="html-preview"]')).toContainText('Example.com');

    // Convert and verify
    await page.locator('[data-testid="convert-button"]').click();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 15000 });
  });

  test('should handle malformed HTML gracefully', async ({ page }) => {
    // Test error handling for malformed HTML
    // Requirements: 1.5, 3.7, 3.8

    const malformedHtml = `
      <html>
        <body>
          <h1>Malformed HTML Test</h1>
          <p>Unclosed paragraph
          <div>Nested div without closing
          <strong>Unclosed strong tag
          <ul>
            <li>Item 1
            <li>Item 2 without closing
          </ul>
          <table>
            <tr><td>Cell without closing
            <tr><td>Another cell</td>
          </table>
        </body>
      </html>
    `;

    await page.locator('[data-testid="html-textarea"]').fill(malformedHtml);

    // The application should still attempt conversion
    await page.locator('[data-testid="convert-button"]').click();

    // Either succeeds with cleaned HTML or shows appropriate error
    const downloadButton = page.locator('[data-testid="download-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');

    // Wait for either success or error
    await Promise.race([
      downloadButton.waitFor({ timeout: 15000 }),
      errorMessage.waitFor({ timeout: 15000 })
    ]);

    // If error occurred, verify error handling
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText(/html|format|parse/i);
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    }
  });

  test('should handle empty and minimal HTML', async ({ page }) => {
    // Test edge cases with minimal content
    // Requirements: 1.5, 3.8

    // Test empty HTML
    await page.locator('[data-testid="html-textarea"]').fill('');
    await page.locator('[data-testid="convert-button"]').click();
    
    // Should show validation error for empty content
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();

    // Test minimal valid HTML
    const minimalHtml = '<html><body><h1>Minimal</h1><p>Content</p></body></html>';
    await page.locator('[data-testid="html-textarea"]').fill(minimalHtml);
    await page.locator('[data-testid="convert-button"]').click();
    
    // Should succeed with minimal content
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });

    // Test HTML with only text
    const textOnlyHtml = '<html><body>Just plain text without any formatting</body></html>';
    await page.locator('[data-testid="html-textarea"]').fill(textOnlyHtml);
    await page.locator('[data-testid="convert-button"]').click();
    
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });
  });
});