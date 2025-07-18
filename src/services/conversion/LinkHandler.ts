import { LinkResource } from '../../models';
import { LinkHandlerService, LinkHandlingError } from './LinkHandlerInterface';

/**
 * Link Handler Service Implementation
 * 
 * This service processes and optimizes hyperlinks for PPTX slides.
 * 
 * Requirements:
 * - 3.6: Preserve hyperlinks in the PPTX output
 */
export class LinkHandler implements LinkHandlerService {
  /**
   * Process a link for PPTX output
   * 
   * @param link - The link resource to process
   * @returns Processed link resource
   */
  processLink(link: LinkResource): LinkResource {
    try {
      // Create a deep copy of the link to avoid modifying the original
      const processedLink: LinkResource = {
        text: link.text,
        href: link.href
      };
      
      // Normalize the URL
      processedLink.href = this.normalizeUrl(processedLink.href);
      
      // Extract text from HTML if needed
      if (processedLink.text.includes('<') && processedLink.text.includes('>')) {
        processedLink.text = this.extractLinkText(processedLink.text);
      }
      
      return processedLink;
    } catch (error) {
      throw new LinkHandlingError(
        `Failed to process link: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Validate and normalize a URL
   * 
   * @param url - The URL to validate and normalize
   * @returns Normalized URL
   */
  normalizeUrl(url: string): string {
    try {
      // Handle empty URLs
      if (!url) {
        return '#';
      }
      
      // Handle anchor links
      if (url.startsWith('#')) {
        return url;
      }
      
      // Check for special protocols like mailto:, tel:, etc.
      if (url.match(/^[a-z]+:/i) && !url.match(/^https?:/i)) {
        return url;
      }
      
      // Handle relative URLs
      if (!url.match(/^[a-z]+:\/\//i)) {
        // If it's a relative URL without protocol, add https://
        if (!url.startsWith('/')) {
          return `https://${url}`;
        }
        
        // For paths starting with /, we can't determine the base URL
        // So we'll just return the path as is
        return url;
      }
      
      // For URLs with protocol, ensure they use https if possible
      if (url.startsWith('http://')) {
        return url.replace('http://', 'https://');
      }
      
      // Return the URL as is for other protocols
      return url;
    } catch (error) {
      // If there's an error, return the original URL
      return url;
    }
  }
  
  /**
   * Extract link text from HTML content
   * 
   * @param html - HTML content to extract link text from
   * @returns Extracted link text
   */
  extractLinkText(html: string): string {
    try {
      // Create a temporary element to parse the HTML
      const tempElement = document.createElement('div');
      tempElement.innerHTML = html;
      
      // Get text content
      return tempElement.textContent || tempElement.innerText || html;
    } catch (error) {
      // If there's an error, return the original HTML
      return html;
    }
  }
  
  /**
   * Apply link styling
   * 
   * @param link - The link resource
   * @returns Link with applied styling
   */
  applyLinkStyling(link: LinkResource): Record<string, any> {
    try {
      // Default link options
      const linkOptions: Record<string, any> = {
        x: 0.5,
        y: 2,
        w: '90%',
        h: 0.5,
        fontSize: 18,
        color: '0000FF',
        underline: true,
        hyperlink: { url: link.href },
        tooltip: link.href // Add tooltip showing the URL
      };
      
      return linkOptions;
    } catch (error) {
      throw new LinkHandlingError(
        `Failed to apply link styling: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Check if a URL is valid
   * 
   * @param url - The URL to check
   * @returns Whether the URL is valid
   */
  isValidUrl(url: string): boolean {
    try {
      // Handle empty URLs
      if (!url) {
        return false;
      }
      
      // Handle anchor links
      if (url.startsWith('#')) {
        return true;
      }
      
      // Try to create a URL object
      new URL(url);
      return true;
    } catch (error) {
      // If the URL is relative, it might still be valid
      if (!url.match(/^[a-z]+:\/\//i)) {
        return true;
      }
      
      return false;
    }
  }
  
  /**
   * Extract domain from URL
   * 
   * @param url - The URL to extract domain from
   * @returns Extracted domain
   */
  extractDomain(url: string): string {
    try {
      // Try to create a URL object
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      // If there's an error, return empty string
      return '';
    }
  }
}