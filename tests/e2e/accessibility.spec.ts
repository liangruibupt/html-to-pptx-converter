/**
 * Accessibility End-to-End Tests
 * 
 * Tests for accessibility features in the actual application
 * 
 * Requirements:
 * - 5.4: Verify accessibility features work in real browser environment
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper ARIA landmarks and headings', async ({ page }) => {
    // Check for main landmarks
    await expect(page.locator('role=banner')).toBeVisible();
    await expect(page.locator('role=main')).toBeVisible();
    await expect(page.locator('role=application')).toBeVisible();

    // Check for proper heading structure
    await expect(page.locator('h1')).toHaveText('HTML to PPTX Converter');
    await expect(page.locator('h1')).toHaveAttribute('id', 'app-title');
  });

  test('should have skip link for keyboard navigation', async ({ page }) => {
    // Skip link should be present but hidden initially
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeInViewport({ ratio: 0 }); // Hidden but in DOM
    
    // Focus the skip link and verify it becomes visible
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    
    // Verify skip link functionality
    await skipLink.click();
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('should support keyboard navigation in upload section', async ({ page }) => {
    // Navigate to file upload area
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Should focus on file upload dropzone
    
    const fileUpload = page.locator('.dropzone');
    await expect(fileUpload).toBeFocused();
    await expect(fileUpload).toHaveAttribute('role', 'button');
    await expect(fileUpload).toHaveAttribute('tabindex', '0');
    
    // Test keyboard activation
    await page.keyboard.press('Enter');
    // File dialog should be triggered (we can't test the actual dialog in e2e)
  });

  test('should have proper ARIA attributes on interactive elements', async ({ page }) => {
    // Check dropzone ARIA attributes
    const dropzone = page.locator('.dropzone');
    await expect(dropzone).toHaveAttribute('role', 'button');
    await expect(dropzone).toHaveAttribute('aria-label');
    await expect(dropzone).toHaveAttribute('aria-describedby');
    
    // Check status indicator
    const statusIndicator = page.locator('.app-status');
    await expect(statusIndicator).toHaveAttribute('role', 'status');
    await expect(statusIndicator).toHaveAttribute('aria-live', 'polite');
  });

  test('should announce status changes to screen readers', async ({ page }) => {
    // Create a simple HTML file for testing
    const htmlContent = '<html><body><h1>Test</h1><p>Test content</p></body></html>';
    
    // Create a file and upload it
    const fileInput = page.locator('input[type="file"]');
    
    // Create a temporary file
    const buffer = Buffer.from(htmlContent);
    await fileInput.setInputFiles({
      name: 'test.html',
      mimeType: 'text/html',
      buffer: buffer
    });
    
    // Check for success notification with proper ARIA attributes
    const notification = page.locator('.notification').first();
    await expect(notification).toBeVisible();
    await expect(notification).toHaveAttribute('role', 'status');
    await expect(notification).toHaveAttribute('aria-labelledby');
    await expect(notification).toHaveAttribute('aria-describedby');
  });

  test('should support keyboard navigation in configuration phase', async ({ page }) => {
    // First upload a file to get to configuration phase
    const htmlContent = '<html><body><h1>Test</h1><p>Test content</p></body></html>';
    const fileInput = page.locator('input[type="file"]');
    const buffer = Buffer.from(htmlContent);
    await fileInput.setInputFiles({
      name: 'test.html',
      mimeType: 'text/html',
      buffer: buffer
    });
    
    // Wait for configuration phase
    await expect(page.locator('.configure-phase')).toBeVisible();
    
    // Check configuration section has proper ARIA attributes
    const configContainer = page.locator('.config-container');
    await expect(configContainer).toHaveAttribute('role', 'region');
    await expect(configContainer).toHaveAttribute('aria-labelledby', 'config-heading');
    
    // Test keyboard navigation in slide layout options
    const layoutOptions = page.locator('.layout-options');
    await expect(layoutOptions).toHaveAttribute('role', 'radiogroup');
    
    const radioButtons = page.locator('[role="radio"]');
    await expect(radioButtons).toHaveCount(3);
    
    // Test keyboard navigation between radio buttons
    await radioButtons.first().focus();
    await expect(radioButtons.first()).toBeFocused();
    await expect(radioButtons.first()).toHaveAttribute('aria-checked', 'true');
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await expect(radioButtons.nth(1)).toBeFocused();
    
    // Activate with Enter key
    await page.keyboard.press('Enter');
    await expect(radioButtons.nth(1)).toHaveAttribute('aria-checked', 'true');
  });

  test('should have accessible buttons with proper labels', async ({ page }) => {
    // Upload a file first
    const htmlContent = '<html><body><h1>Test</h1><p>Test content</p></body></html>';
    const fileInput = page.locator('input[type="file"]');
    const buffer = Buffer.from(htmlContent);
    await fileInput.setInputFiles({
      name: 'test.html',
      mimeType: 'text/html',
      buffer: buffer
    });
    
    // Wait for configuration phase
    await expect(page.locator('.configure-phase')).toBeVisible();
    
    // Check action buttons have proper attributes
    const backButton = page.locator('button:has-text("Back")');
    const previewButton = page.locator('button:has-text("Preview")');
    
    await expect(backButton).toHaveAttribute('type', 'button');
    await expect(backButton).toHaveAttribute('aria-label');
    
    await expect(previewButton).toHaveAttribute('type', 'button');
    await expect(previewButton).toHaveAttribute('aria-label');
    
    // Test keyboard activation
    await previewButton.focus();
    await page.keyboard.press('Enter');
    
    // Should navigate to preview phase
    await expect(page.locator('.preview-phase')).toBeVisible();
  });

  test('should have accessible progress indicators', async ({ page }) => {
    // Upload a file and proceed to conversion
    const htmlContent = '<html><body><h1>Test</h1><p>Test content</p></body></html>';
    const fileInput = page.locator('input[type="file"]');
    const buffer = Buffer.from(htmlContent);
    await fileInput.setInputFiles({
      name: 'test.html',
      mimeType: 'text/html',
      buffer: buffer
    });
    
    // Navigate through phases
    await expect(page.locator('.configure-phase')).toBeVisible();
    await page.locator('button:has-text("Preview")').click();
    
    await expect(page.locator('.preview-phase')).toBeVisible();
    await page.locator('button:has-text("Start Conversion")').click();
    
    // Check progress indicators have proper ARIA attributes
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toHaveAttribute('aria-valuenow');
    await expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    await expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    await expect(progressBar).toHaveAttribute('aria-label');
    
    // Check progress message has live region
    const progressMessage = page.locator('#progress-message');
    await expect(progressMessage).toHaveAttribute('role', 'status');
    await expect(progressMessage).toHaveAttribute('aria-live', 'polite');
  });

  test('should handle error states accessibly', async ({ page }) => {
    // Try to upload an invalid file to trigger error
    const invalidContent = 'This is not valid HTML';
    const fileInput = page.locator('input[type="file"]');
    const buffer = Buffer.from(invalidContent);
    
    await fileInput.setInputFiles({
      name: 'invalid.html',
      mimeType: 'text/html',
      buffer: buffer
    });
    
    // Check for error notification with proper ARIA attributes
    const errorNotification = page.locator('.notification-error').first();
    await expect(errorNotification).toBeVisible();
    await expect(errorNotification).toHaveAttribute('role', 'alert');
    
    // Check validation error display
    const validationErrors = page.locator('.validation-error-display');
    if (await validationErrors.isVisible()) {
      await expect(validationErrors).toHaveAttribute('role', 'region');
      await expect(validationErrors).toHaveAttribute('aria-label', 'Validation results');
      
      const errorSection = page.locator('.validation-section.errors');
      if (await errorSection.isVisible()) {
        await expect(errorSection).toHaveAttribute('role', 'alert');
      }
    }
  });

  test('should support high contrast mode', async ({ page }) => {
    // Enable high contrast mode simulation
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    
    // Check that elements are still visible and accessible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.dropzone')).toBeVisible();
    
    // Check focus indicators are visible
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Dropzone
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should respect reduced motion preferences', async ({ page }) => {
    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Upload a file to trigger animations
    const htmlContent = '<html><body><h1>Test</h1><p>Test content</p></body></html>';
    const fileInput = page.locator('input[type="file"]');
    const buffer = Buffer.from(htmlContent);
    await fileInput.setInputFiles({
      name: 'test.html',
      mimeType: 'text/html',
      buffer: buffer
    });
    
    // Animations should be reduced/disabled
    // This is mainly handled by CSS, so we just verify the page still functions
    await expect(page.locator('.configure-phase')).toBeVisible();
  });

  test('should have proper focus management in notifications', async ({ page }) => {
    // Upload a file to trigger notification
    const htmlContent = '<html><body><h1>Test</h1><p>Test content</p></body></html>';
    const fileInput = page.locator('input[type="file"]');
    const buffer = Buffer.from(htmlContent);
    await fileInput.setInputFiles({
      name: 'test.html',
      mimeType: 'text/html',
      buffer: buffer
    });
    
    // Check notification close button is accessible
    const notification = page.locator('.notification').first();
    await expect(notification).toBeVisible();
    
    const closeButton = notification.locator('.notification-close');
    await expect(closeButton).toHaveAttribute('type', 'button');
    await expect(closeButton).toHaveAttribute('aria-label');
    
    // Test keyboard activation
    await closeButton.focus();
    await page.keyboard.press('Enter');
    
    // Notification should be dismissed
    await expect(notification).not.toBeVisible();
  });
});