import { ListResource } from '../../models';

/**
 * Interface for the list handler service
 * 
 * This service is responsible for processing and optimizing lists for PPTX slides.
 */
export interface ListHandlerService {
  /**
   * Process a list for PPTX output
   * 
   * @param list - The list resource to process
   * @returns Processed list resource
   */
  processList(list: ListResource): ListResource;
  
  /**
   * Format list items
   * 
   * @param items - The list items to format
   * @param ordered - Whether the list is ordered
   * @returns Formatted list items
   */
  formatListItems(items: string[], ordered: boolean): string[];
  
  /**
   * Determine bullet type based on list style
   * 
   * @param list - The list resource
   * @returns Bullet configuration object
   */
  determineBulletType(list: ListResource): Record<string, any>;
  
  /**
   * Apply list styling
   * 
   * @param list - The list resource
   * @returns List with applied styling
   */
  applyListStyling(list: ListResource): Record<string, any>;
  
  /**
   * Handle nested lists
   * 
   * @param items - The list items that may contain nested lists
   * @returns Processed list items with proper indentation for nested lists
   */
  handleNestedLists(items: string[]): string[];
}

/**
 * List handling error class
 * 
 * Custom error class for list handling errors
 */
export class ListHandlingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ListHandlingError';
  }
}