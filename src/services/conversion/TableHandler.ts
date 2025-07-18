import { TableResource } from '../../models';
import { TableHandlerService, TableHandlingError } from './TableHandlerInterface';

/**
 * Table Handler Service Implementation
 * 
 * This service processes and optimizes tables for PPTX slides.
 * 
 * Requirements:
 * - 3.5: Handle tables and lists appropriately in the PPTX output
 */
export class TableHandler implements TableHandlerService {
  /**
   * Process a table for PPTX output
   * 
   * @param table - The table resource to process
   * @returns Processed table resource
   */
  processTable(table: TableResource): TableResource {
    try {
      // Create a deep copy of the table to avoid modifying the original
      const processedTable: TableResource = {
        headers: [...table.headers],
        rows: table.rows.map(row => [...row]),
        style: table.style ? { ...table.style } : {}
      };
      
      // Ensure all rows have the same number of columns
      this.normalizeTableDimensions(processedTable);
      
      // Apply default styling if not present
      if (!processedTable.style) {
        processedTable.style = {};
      }
      
      // Ensure style has necessary properties
      processedTable.style = {
        ...processedTable.style,
        border: processedTable.style.border !== undefined ? processedTable.style.border : true,
        width: processedTable.style.width || '100%',
        cellPadding: processedTable.style.cellPadding || '5',
        backgroundColor: processedTable.style.backgroundColor || 'transparent',
        textAlign: processedTable.style.textAlign || 'left'
      };
      
      return processedTable;
    } catch (error) {
      throw new TableHandlingError(
        `Failed to process table: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Normalize table dimensions to ensure all rows have the same number of columns
   * 
   * @param table - The table to normalize
   */
  private normalizeTableDimensions(table: TableResource): void {
    // Determine the maximum number of columns
    const headerCount = table.headers.length;
    let maxColumns = headerCount;
    
    table.rows.forEach(row => {
      maxColumns = Math.max(maxColumns, row.length);
    });
    
    // Pad headers if needed
    while (table.headers.length < maxColumns) {
      table.headers.push('');
    }
    
    // Pad rows if needed
    table.rows = table.rows.map(row => {
      const paddedRow = [...row];
      while (paddedRow.length < maxColumns) {
        paddedRow.push('');
      }
      return paddedRow;
    });
  }
  
  /**
   * Format table headers
   * 
   * @param headers - The table headers to format
   * @returns Formatted table headers
   */
  formatHeaders(headers: string[]): any[] {
    return headers.map(header => ({
      text: header,
      bold: true,
      color: '333333',
      fill: 'EEEEEE',
      valign: 'middle',
      align: 'center'
    }));
  }
  
  /**
   * Format table rows
   * 
   * @param rows - The table rows to format
   * @returns Formatted table rows
   */
  formatRows(rows: any[][]): any[][] {
    return rows.map((row, rowIndex) => {
      return row.map((cell, cellIndex) => {
        // Basic cell formatting
        const cellFormat: any = {
          text: String(cell),
          valign: 'middle'
        };
        
        // Add zebra striping for better readability
        if (rowIndex % 2 === 1) {
          cellFormat.fill = 'F9F9F9';
        }
        
        return cellFormat;
      });
    });
  }
  
  /**
   * Calculate optimal column widths
   * 
   * @param table - The table resource
   * @returns Array of column widths
   */
  calculateColumnWidths(table: TableResource): number[] {
    const columnCount = table.headers.length;
    
    // If no columns, return empty array
    if (columnCount === 0) {
      return [];
    }
    
    // Calculate content length for each column
    const columnLengths: number[] = Array(columnCount).fill(0);
    
    // Check headers
    table.headers.forEach((header, index) => {
      columnLengths[index] = Math.max(columnLengths[index], header.length);
    });
    
    // Check rows
    table.rows.forEach(row => {
      row.forEach((cell, index) => {
        if (index < columnCount) {
          const cellLength = String(cell).length;
          columnLengths[index] = Math.max(columnLengths[index], cellLength);
        }
      });
    });
    
    // Convert lengths to proportional widths
    const totalLength = columnLengths.reduce((sum, length) => sum + length, 0);
    const minWidth = 0.5; // Minimum width in inches
    
    // If all columns are empty, use equal widths
    if (totalLength === 0) {
      return Array(columnCount).fill(1);
    }
    
    // Calculate proportional widths with minimum width constraint
    return columnLengths.map(length => {
      const proportion = length / totalLength;
      return Math.max(proportion * 5, minWidth); // Scale by 5 inches total width
    });
  }
  
  /**
   * Apply table styling
   * 
   * @param table - The table resource
   * @returns Table with applied styling
   */
  applyTableStyling(table: TableResource): Record<string, any> {
    const tableStyle = table.style || {};
    
    // Default table options
    const tableOptions: Record<string, any> = {
      x: 0.5,
      y: 2,
      w: '90%',
      colW: this.calculateColumnWidths(table),
      border: { pt: tableStyle.border ? 1 : 0, color: '666666' },
      cellPadding: parseInt(tableStyle.cellPadding || '5', 10),
      align: tableStyle.textAlign || 'left'
    };
    
    // Apply advanced styling if available
    if (tableStyle.cellDetails) {
      tableOptions.complex = true;
      
      // Process cell details for merged cells and custom formatting
      const cellDetails = tableStyle.cellDetails;
      if (Array.isArray(cellDetails) && cellDetails.length > 0) {
        // Handle merged cells
        const mergedCells: any[] = [];
        
        cellDetails.forEach((row, rowIndex) => {
          if (!Array.isArray(row)) return;
          
          row.forEach((cell, colIndex) => {
            if (!cell) return;
            
            // Check for merged cells
            if (cell.colSpan > 1 || cell.rowSpan > 1) {
              mergedCells.push({
                row: rowIndex + 1, // +1 because headers are row 0
                col: colIndex,
                rowspan: cell.rowSpan,
                colspan: cell.colSpan
              });
            }
          });
        });
        
        if (mergedCells.length > 0) {
          tableOptions.mergedCells = mergedCells;
        }
      }
    }
    
    return tableOptions;
  }
}