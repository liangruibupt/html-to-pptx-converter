import { test, expect } from '@playwright/test';

/**
 * Test to check if the actual application is running
 */

test('check application availability', async ({ page }) => {
  // Try different possible URLs
  const urlsToTry = [
    'http://localhost:9323',
    'http://localhost:3000', 
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:4173'
  ];
  
  for (const url of urlsToTry) {
    try {
      console.log(`Trying URL: ${url}`);
      await page.goto(url, { timeout: 5000 });
      
      const title = await page.title();
      const bodyText = await page.locator('body').textContent();
      
      console.log(`URL: ${url}`);
      console.log(`Title: ${title}`);
      console.log(`Body preview: ${bodyText?.substring(0, 200)}`);
      console.log('---');
      
      // Check if this looks like our HTML to PPTX converter app
      if (title.toLowerCase().includes('html') && title.toLowerCase().includes('pptx')) {
        console.log(`Found app at: ${url}`);
        break;
      }
      
      if (bodyText?.toLowerCase().includes('html') && bodyText?.toLowerCase().includes('pptx')) {
        console.log(`Found app content at: ${url}`);
        break;
      }
      
    } catch (error) {
      console.log(`Failed to connect to ${url}: ${error}`);
    }
  }
});