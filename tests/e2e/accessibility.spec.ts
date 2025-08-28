import { test, expect } from '@playwright/test';

/**
 * End-to-End Accessibility Tests
 * 
 * These tests verify the application meets accessibility requirements.
 * Requirements: 5.4 - Accessibility features
 */

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Test ARIA attributes
    // Requirements: 5.4

    // Check main application has proper role
    await expect(page.locator('[role="main"]')).toBeVisible();

    // Check form elements have proper labels
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('aria-label');

    // Check buttons have accessible names
    const convertButton = page.locator('[data-testid="convert-button"]');
    await expect(convertButton).toHaveAttribute('aria-label');

    // Check progress indicators have proper ARIA
    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="html-textarea"]').fill('<html><body><h1>Test</h1></body></html>');
    await convertButton.click();

    const progressIndicator = page.locator('[data-testid="conversion-progress"]');
    await expect(progressIndicator).toHaveAttribute('role', 'progressbar');
    await expect(progressIndicator).toHaveAttribute('aria-label');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Test keyboard navigation
    // Requirements: 5.4

    // Tab through main interface elements
    await page.keyboard.press('Tab'); // Should focus first interactive element
    
    // Verify file upload is focusable
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeFocused();

    // Continue tabbing through interface
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Switch to HTML input using keyboard
    const htmlInputTab = page.locator('[data-testid="html-input-tab"]');
    await htmlInputTab.focus();
    await page.keyboard.press('Enter');

    // Verify HTML textarea is accessible via keyboard
    await page.keyboard.press('Tab');
    const htmlTextarea = page.locator('[data-testid="html-textarea"]');
    await expect(htmlTextarea).toBeFocused();

    // Type content using keyboard
    await page.keyboard.type('<html><body><h1>Keyboard Test</h1></body></html>');

    // Navigate to convert button using keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const convertButton = page.locator('[data-testid="convert-button"]');
    await expect(convertButton).toBeFocused();

    // Activate convert button with keyboard
    await page.keyboard.press('Enter');
    
    // Verify conversion starts
    await expect(page.locator('[data-testid="conversion-progress"]')).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Test heading structure
    // Requirements: 5.4

    // Check main heading exists
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible();

    // Check heading hierarchy is logical
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    let previousLevel = 0;
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const currentLevel = parseInt(tagName.charAt(1));
      
      // Heading levels should not skip more than one level
      expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      previousLevel = currentLevel;
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Test color contrast (basic check)
    // Requirements: 5.4

    // Check that text elements have sufficient contrast
    const textElements = await page.locator('p, span, label, button').all();
    
    for (const element of textElements.slice(0, 5)) { // Check first 5 elements
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        };
      });
      
      // Basic check that color and background are different
      expect(styles.color).not.toBe(styles.backgroundColor);
    }
  });

  test('should support screen reader announcements', async ({ page }) => {
    // Test screen reader support
    // Requirements: 5.4

    // Check for live regions for dynamic content
    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="html-textarea"]').fill('<html><body><h1>Test</h1></body></html>');
    
    // Start conversion
    await page.locator('[data-testid="convert-button"]').click();

    // Check for aria-live regions for status updates
    const liveRegion = page.locator('[aria-live]');
    await expect(liveRegion).toBeVisible();

    // Wait for completion and check success announcement
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });
    
    // Verify success state is announced
    const successMessage = page.locator('[aria-live="polite"]');
    await expect(successMessage).toBeVisible();
  });

  test('should handle focus management during conversion', async ({ page }) => {
    // Test focus management
    // Requirements: 5.4

    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="html-textarea"]').fill('<html><body><h1>Focus Test</h1></body></html>');
    
    const convertButton = page.locator('[data-testid="convert-button"]');
    await convertButton.focus();
    await convertButton.click();

    // During conversion, focus should be managed appropriately
    // Convert button should be disabled or focus should move to progress
    const isButtonDisabled = await convertButton.isDisabled();
    const isProgressFocused = await page.locator('[data-testid="conversion-progress"]').isFocused();
    
    expect(isButtonDisabled || isProgressFocused).toBeTruthy();

    // After conversion, focus should move to download button
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });
    
    // Focus should be on download button or it should be focusable
    const downloadButton = page.locator('[data-testid="download-button"]');
    await downloadButton.focus();
    await expect(downloadButton).toBeFocused();
  });

  test('should provide error messages in accessible format', async ({ page }) => {
    // Test accessible error handling
    // Requirements: 5.4

    // Trigger validation error
    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="convert-button"]').click(); // Convert without content

    // Check error message accessibility
    const errorMessage = page.locator('[data-testid="validation-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveAttribute('role', 'alert');
    await expect(errorMessage).toHaveAttribute('aria-live', 'assertive');

    // Error should be associated with the relevant input
    const htmlTextarea = page.locator('[data-testid="html-textarea"]');
    const ariaDescribedBy = await htmlTextarea.getAttribute('aria-describedby');
    expect(ariaDescribedBy).toBeTruthy();
  });

  test('should work with high contrast mode', async ({ page }) => {
    // Test high contrast mode compatibility
    // Requirements: 5.4

    // Simulate high contrast mode by forcing colors
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            background-color: black !important;
            color: white !important;
            border-color: white !important;
          }
        }
      `
    });

    // Verify interface is still usable
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
    
    // Test basic functionality still works
    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="html-textarea"]').fill('<html><body><h1>High Contrast Test</h1></body></html>');
    await page.locator('[data-testid="convert-button"]').click();
    
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 10000 });
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Test reduced motion support
    // Requirements: 5.4

    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Verify animations are reduced or disabled
    await page.locator('[data-testid="html-input-tab"]').click();
    await page.locator('[data-testid="html-textarea"]').fill('<html><body><h1>Motion Test</h1></body></html>');
    await page.locator('[data-testid="convert-button"]').click();

    // Progress indicator should still be visible but with reduced motion
    const progressIndicator = page.locator('[data-testid="conversion-progress"]');
    await expect(progressIndicator).toBeVisible();

    // Check that transitions are reduced
    const animationDuration = await progressIndicator.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return computed.animationDuration;
    });

    // In reduced motion mode, animations should be faster or disabled
    expect(animationDuration === '0s' || animationDuration === 'none').toBeTruthy();
  });
});