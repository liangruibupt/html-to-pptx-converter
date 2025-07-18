import { describe, it, expect, beforeEach } from 'vitest';
import { TableHandler, TableHandlingError } from '../../src/services/conversion/TableHandler';
import { TableResource } from '../../src/models';

describe('TableHandler', () => {
  let tableHandler: TableHandler;
  
  beforeEach(() => {
    tableHandler = new TableHandler();
  });
  
  describe('processTable', () => {
    it('should process a table with headers and rows', () => {
      const tableResource: TableResource = {
        headers: ['Header 1', 'Header 2'],
        rows: [
          ['Row 1, Cell 1', 'Row 1, Cell 2'],
          ['Row 2, Cell 1', 'Row 2, Cell 2']
        ]
      };
      
      const processedTable = tableHandler.processTable(tableResource);
      
      expect(processedTable).toBeDefined();
      expect(processedTable.headers).toEqual(['Header 1', 'Header 2']);
      expect(processedTable.rows).toEqual([
        ['Row 1, Cell 1', 'Row 1, Cell 2'],
        ['Row 2, Cell 1', 'Row 2, Cell 2']
      ]);
      expect(processedTable.style).toBeDefined();
      expect(processedTable.style!.border).toBe(true);
    });
    
    it('should normalize table dimensions', () => {
      const tableResource: TableResource = {
        headers: ['Header 1', 'Header 2'],
        rows: [
          ['Row 1, Cell 1', 'Row 1, Cell 2', 'Extra Cell'],
          ['Row 2, Cell 1']
        ]
      };
      
      const processedTable = tableHandler.processTable(tableResource);
      
      expect(processedTable.headers).toHaveLength(3);
      expect(processedTable.headers[2]).toBe('');
      expect(processedTable.rows[0]).toHaveLength(3);
      expect(processedTable.rows[1]).toHaveLength(3);
      expect(processedTable.rows[1][1]).toBe('');
      expect(processedTable.rows[1][2]).toBe('');
    });
    
    it('should apply default styling if not present', () => {
      const tableResource: TableResource = {
        headers: ['Header 1', 'Header 2'],
        rows: [
          ['Row 1, Cell 1', 'Row 1, Cell 2'],
          ['Row 2, Cell 1', 'Row 2, Cell 2']
        ]
      };
      
      const processedTable = tableHandler.processTable(tableResource);
      
      expect(processedTable.style).toBeDefined();
      expect(processedTable.style!.border).toBe(true);
      expect(processedTable.style!.width).toBe('100%');
      expect(processedTable.style!.cellPadding).toBe('5');
      expect(processedTable.style!.backgroundColor).toBe('transparent');
      expect(processedTable.style!.textAlign).toBe('left');
    });
    
    it('should preserve existing styling', () => {
      const tableResource: TableResource = {
        headers: ['Header 1', 'Header 2'],
        rows: [
          ['Row 1, Cell 1', 'Row 1, Cell 2'],
          ['Row 2, Cell 1', 'Row 2, Cell 2']
        ],
        style: {
          border: false,
          width: '80%',
          cellPadding: '10',
          backgroundColor: '#F0F0F0',
          textAlign: 'center'
        }
      };
      
      const processedTable = tableHandler.processTable(tableResource);
      
      expect(processedTable.style).toBeDefined();
      expect(processedTable.style!.border).toBe(false);
      expect(processedTable.style!.width).toBe('80%');
      expect(processedTable.style!.cellPadding).toBe('10');
      expect(processedTable.style!.backgroundColor).toBe('#F0F0F0');
      expect(processedTable.style!.textAlign).toBe('center');
    });
  });
  
  describe('formatHeaders', () => {
    it('should format headers with proper styling', () => {
      const headers = ['Header 1', 'Header 2'];
      const formattedHeaders = tableHandler.formatHeaders(headers);
      
      expect(formattedHeaders).toHaveLength(2);
      expect(formattedHeaders[0].text).toBe('Header 1');
      expect(formattedHeaders[0].bold).toBe(true);
      expect(formattedHeaders[0].color).toBe('333333');
      expect(formattedHeaders[0].fill).toBe('EEEEEE');
      expect(formattedHeaders[0].valign).toBe('middle');
      expect(formattedHeaders[0].align).toBe('center');
    });
  });
  
  describe('formatRows', () => {
    it('should format rows with proper styling', () => {
      const rows = [
        ['Row 1, Cell 1', 'Row 1, Cell 2'],
        ['Row 2, Cell 1', 'Row 2, Cell 2']
      ];
      
      const formattedRows = tableHandler.formatRows(rows);
      
      expect(formattedRows).toHaveLength(2);
      expect(formattedRows[0][0].text).toBe('Row 1, Cell 1');
      expect(formattedRows[0][0].valign).toBe('middle');
      expect(formattedRows[0][0].fill).toBeUndefined();
      
      // Check zebra striping
      expect(formattedRows[1][0].text).toBe('Row 2, Cell 1');
      expect(formattedRows[1][0].fill).toBe('F9F9F9');
    });
    
    it('should handle non-string cell values', () => {
      const rows = [
        [123, true],
        [null, undefined]
      ];
      
      const formattedRows = tableHandler.formatRows(rows);
      
      expect(formattedRows[0][0].text).toBe('123');
      expect(formattedRows[0][1].text).toBe('true');
      expect(formattedRows[1][0].text).toBe('null');
      expect(formattedRows[1][1].text).toBe('undefined');
    });
  });
  
  describe('calculateColumnWidths', () => {
    it('should calculate column widths based on content length', () => {
      const tableResource: TableResource = {
        headers: ['Short', 'This is a much longer header'],
        rows: [
          ['Short text', 'Longer text here'],
          ['A', 'B']
        ]
      };
      
      const columnWidths = tableHandler.calculateColumnWidths(tableResource);
      
      expect(columnWidths).toHaveLength(2);
      expect(columnWidths[0]).toBeLessThan(columnWidths[1]);
      expect(columnWidths[0]).toBeGreaterThanOrEqual(0.5); // Minimum width
    });
    
    it('should handle empty tables', () => {
      const emptyTable: TableResource = {
        headers: [],
        rows: []
      };
      
      const columnWidths = tableHandler.calculateColumnWidths(emptyTable);
      
      expect(columnWidths).toHaveLength(0);
    });
    
    it('should handle tables with empty content', () => {
      const emptyContentTable: TableResource = {
        headers: ['', ''],
        rows: [
          ['', ''],
          ['', '']
        ]
      };
      
      const columnWidths = tableHandler.calculateColumnWidths(emptyContentTable);
      
      expect(columnWidths).toHaveLength(2);
      expect(columnWidths[0]).toBe(1);
      expect(columnWidths[1]).toBe(1);
    });
  });
  
  describe('applyTableStyling', () => {
    it('should apply basic table styling', () => {
      const tableResource: TableResource = {
        headers: ['Header 1', 'Header 2'],
        rows: [
          ['Row 1, Cell 1', 'Row 1, Cell 2'],
          ['Row 2, Cell 1', 'Row 2, Cell 2']
        ],
        style: {
          border: true,
          cellPadding: '8',
          textAlign: 'center'
        }
      };
      
      const tableOptions = tableHandler.applyTableStyling(tableResource);
      
      expect(tableOptions.x).toBe(0.5);
      expect(tableOptions.y).toBe(2);
      expect(tableOptions.w).toBe('90%');
      expect(tableOptions.colW).toHaveLength(2);
      expect(tableOptions.border.pt).toBe(1);
      expect(tableOptions.cellPadding).toBe(8);
      expect(tableOptions.align).toBe('center');
    });
    
    it('should handle merged cells', () => {
      const tableResource: TableResource = {
        headers: ['Header 1', 'Header 2', 'Header 3'],
        rows: [
          ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
          ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3']
        ],
        style: {
          cellDetails: [
            [
              { colSpan: 2, rowSpan: 1, align: 'center' },
              null,
              { colSpan: 1, rowSpan: 1, align: 'right' }
            ],
            [
              { colSpan: 1, rowSpan: 1, align: 'left' },
              { colSpan: 1, rowSpan: 1, align: 'center' },
              { colSpan: 1, rowSpan: 1, align: 'right' }
            ]
          ]
        }
      };
      
      const tableOptions = tableHandler.applyTableStyling(tableResource);
      
      expect(tableOptions.complex).toBe(true);
      expect(tableOptions.mergedCells).toBeDefined();
      expect(tableOptions.mergedCells).toHaveLength(1);
      expect(tableOptions.mergedCells[0].colspan).toBe(2);
    });
    
    it('should handle tables without style', () => {
      const tableResource: TableResource = {
        headers: ['Header 1', 'Header 2'],
        rows: [
          ['Row 1, Cell 1', 'Row 1, Cell 2'],
          ['Row 2, Cell 1', 'Row 2, Cell 2']
        ]
      };
      
      const tableOptions = tableHandler.applyTableStyling(tableResource);
      
      expect(tableOptions.border.pt).toBe(0);
      expect(tableOptions.cellPadding).toBe(5);
      expect(tableOptions.align).toBe('left');
    });
  });
});