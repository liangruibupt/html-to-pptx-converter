import { LinkResource } from '../../models';

/**
 * Interface for the link handler service
 * 
 * This service is responsible for processing and optimizing hyperlinks for PPTX slides.
 */
export interface LinkHandlerService {
  /**
   * Process a link for PPTX output
   * 
   * @param link - The link resource to process
   * @returns Processed link resource
   */
  processLink(link: LinkResource): LinkResource;
  
  /**
   * Validate and normalize a URL
   * 
   * @param url - The URL to validate and normalize
   * @returns Normalized URL
   */
  normalizeUrl(url: string): string;
  
  /**
   * Extract link text from HTML content
   * 
   * @param html - HTML content to extract link text from
   * @returns Extracted link text
   */
  extractLinkText(html: string): string;
  
  /**
   * Apply link styling
   * 
   * @param link - The link resource
   * @returns Link with applied styling
   */
  applyLinkStyling(link: LinkResource): Record<string, any>;
}

/**
 * Link handling error class
 * 
 * Custom error class for link handling errors
 */
export class LinkHandlingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LinkHandlingError';
  }
}