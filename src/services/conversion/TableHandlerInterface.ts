import { TableResource } from '../../models';

/**
 * Interface for the table handler service
 * 
 * This service is responsible for processing and optimizing tables for PPTX slides.
 */
export interface TableHandlerService {
  /**
   * Process a table for PPTX output
   * 
   * @param table - The table resource to process
   * @returns Processed table resource
   */
  processTable(table: TableResource): TableResource;
  
  /**
   * Format table headers
   * 
   * @param headers - The table headers to format
   * @returns Formatted table headers
   */
  formatHeaders(headers: string[]): any[];
  
  /**
   * Format table rows
   * 
   * @param rows - The table rows to format
   * @returns Formatted table rows
   */
  formatRows(rows: any[][]): any[][];
  
  /**
   * Calculate optimal column widths
   * 
   * @param table - The table resource
   * @returns Array of column widths
   */
  calculateColumnWidths(table: TableResource): number[];
  
  /**
   * Apply table styling
   * 
   * @param table - The table resource
   * @returns Table with applied styling
   */
  applyTableStyling(table: TableResource): Record<string, any>;
}

/**
 * Table handling error class
 * 
 * Custom error class for table handling errors
 */
export class TableHandlingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TableHandlingError';
  }
}