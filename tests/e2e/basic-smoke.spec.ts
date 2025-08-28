import { test, expect } from '@playwright/test';

/**
 * Basic Smoke Tests for E2E Setup
 * 
 * These tests verify that the basic application loads and the e2e testing setup works.
 * Requirements: All - Basic application functionality
 */

test.describe('Basic Smoke Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    
    // Verify the page loads
    await expect(page).toHaveTitle(/HTML to PPTX Converter/i);
    
    // Verify the root element exists
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should have basic HTML structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic HTML elements
    await expect(page.locator('html')).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
    
    // Verify the page is interactive
    await page.waitForLoadState('networkidle');
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    
    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667 },  // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 } // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Verify page is still visible and functional
      const root = page.locator('#root');
      await expect(root).toBeVisible();
      
      // Check that content fits within viewport
      const body = await page.locator('body').boundingBox();
      expect(body?.width).toBeLessThanOrEqual(viewport.width);
    }
  });
});