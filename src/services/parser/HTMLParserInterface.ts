import { HTMLContent } from '../../models';

/**
 * Interface for the HTML parser service
 * 
 * This service is responsible for safely parsing HTML content and handling
 * any errors that may occur during the parsing process.
 */
export interface HTMLParserService {
  /**
   * Parse HTML content into a structured format
   * 
   * @param html - Raw HTML string to parse
   * @returns Parsed HTML content object
   * @throws Error if the HTML is malformed or cannot be parsed
   */
  parseHTML(html: string): HTMLContent;
  
  /**
   * Validate if a string is valid HTML
   * 
   * @param html - HTML string to validate
   * @returns True if the HTML is valid, false otherwise
   */
  validateHTML(html: string): boolean;
  
  /**
   * Get error details for invalid HTML
   * 
   * @param html - HTML string that failed validation
   * @returns Error message describing the issue with the HTML
   */
  getHTMLValidationError(html: string): string;
}

/**
 * HTML parsing error class
 * 
 * Custom error class for HTML parsing errors with additional context
 */
export class HTMLParsingError extends Error {
  /**
   * Position in the HTML where the error occurred
   */
  position?: { line: number; column: number };
  
  /**
   * HTML snippet around the error location
   */
  context?: string;
  
  constructor(message: string, position?: { line: number; column: number }, context?: string) {
    super(message);
    this.name = 'HTMLParsingError';
    this.position = position;
    this.context = context;
  }
}