import { test, expect } from '@playwright/test';

/**
 * Debug test to inspect the actual page content
 */

test('debug page content', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Get page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Get page content
  const bodyContent = await page.locator('body').textContent();
  console.log('Body content:', bodyContent?.substring(0, 500));
  
  // Get HTML structure
  const htmlStructure = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const structure = [];
    for (let i = 0; i < Math.min(elements.length, 20); i++) {
      const el = elements[i];
      structure.push({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        classes: Array.from(el.classList),
        textContent: el.textContent?.substring(0, 100)
      });
    }
    return structure;
  });
  
  console.log('HTML structure:', JSON.stringify(htmlStructure, null, 2));
  
  // Check if React root exists
  const reactRoot = page.locator('#root');
  const rootExists = await reactRoot.count();
  console.log('React root exists:', rootExists > 0);
  
  if (rootExists > 0) {
    const rootContent = await reactRoot.textContent();
    console.log('Root content:', rootContent?.substring(0, 200));
  }
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-page.png', fullPage: true });
});