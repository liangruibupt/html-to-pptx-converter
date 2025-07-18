import { describe, it, expect, beforeEach } from 'vitest';
import { ListHandler, ListHandlingError } from '../../src/services/conversion/ListHandler';
import { ListResource } from '../../src/models';

describe('ListHandler', () => {
  let listHandler: ListHandler;
  
  beforeEach(() => {
    listHandler = new ListHandler();
  });
  
  describe('processList', () => {
    it('should process an unordered list', () => {
      const listResource: ListResource = {
        items: ['Item 1', 'Item 2', 'Item 3'],
        ordered: false
      };
      
      const processedList = listHandler.processList(listResource);
      
      expect(processedList).toBeDefined();
      expect(processedList.items).toEqual(['Item 1', 'Item 2', 'Item 3']);
      expect(processedList.ordered).toBe(false);
      expect(processedList.style).toBeDefined();
      expect(processedList.style!.type).toBe('disc');
    });
    
    it('should process an ordered list', () => {
      const listResource: ListResource = {
        items: ['Item 1', 'Item 2', 'Item 3'],
        ordered: true
      };
      
      const processedList = listHandler.processList(listResource);
      
      expect(processedList).toBeDefined();
      expect(processedList.items).toEqual(['Item 1', 'Item 2', 'Item 3']);
      expect(processedList.ordered).toBe(true);
      expect(processedList.style).toBeDefined();
      expect(processedList.style!.type).toBe('1');
    });
    
    it('should apply default styling if not present', () => {
      const listResource: ListResource = {
        items: ['Item 1', 'Item 2', 'Item 3'],
        ordered: false
      };
      
      const processedList = listHandler.processList(listResource);
      
      expect(processedList.style).toBeDefined();
      expect(processedList.style!.type).toBe('disc');
      expect(processedList.style!.start).toBe('1');
      expect(processedList.style!.fontSize).toBe('12pt');
      expect(processedList.style!.fontFamily).toBe('Arial');
      expect(processedList.style!.color).toBe('#000000');
      expect(processedList.style!.textAlign).toBe('left');
    });
    
    it('should preserve existing styling', () => {
      const listResource: ListResource = {
        items: ['Item 1', 'Item 2', 'Item 3'],
        ordered: true,
        style: {
          type: 'A',
          start: '5',
          fontSize: '16pt',
          fontFamily: 'Helvetica',
          color: '#FF0000',
          textAlign: 'center'
        }
      };
      
      const processedList = listHandler.processList(listResource);
      
      expect(processedList.style).toBeDefined();
      expect(processedList.style!.type).toBe('A');
      expect(processedList.style!.start).toBe('5');
      expect(processedList.style!.fontSize).toBe('16pt');
      expect(processedList.style!.fontFamily).toBe('Helvetica');
      expect(processedList.style!.color).toBe('#FF0000');
      expect(processedList.style!.textAlign).toBe('center');
    });
  });
  
  describe('formatListItems', () => {
    it('should format list items by stripping HTML tags', () => {
      const items = [
        '<strong>Bold item</strong>',
        'Regular item',
        '<em>Italic item</em>'
      ];
      
      const formattedItems = listHandler.formatListItems(items, false);
      
      expect(formattedItems).toHaveLength(3);
      expect(formattedItems[0]).toBe('Bold item');
      expect(formattedItems[1]).toBe('Regular item');
      expect(formattedItems[2]).toBe('Italic item');
    });
    
    it('should handle line breaks in list items', () => {
      const items = [
        'Line 1<br>Line 2',
        '<p>Paragraph 1</p><p>Paragraph 2</p>'
      ];
      
      const formattedItems = listHandler.formatListItems(items, false);
      
      expect(formattedItems).toHaveLength(2);
      expect(formattedItems[0]).toBe('Line 1 Line 2');
      expect(formattedItems[1]).toBe('Paragraph 1 Paragraph 2');
    });
  });
  
  describe('handleNestedLists', () => {
    it('should handle nested lists by adding indentation', () => {
      const items = [
        'Parent 1<ul><li>Child 1</li><li>Child 2</li></ul>',
        'Parent 2<ol><li>Child 3</li><li>Child 4</li></ol>'
      ];
      
      const processedItems = listHandler.handleNestedLists(items);
      
      expect(processedItems).toHaveLength(2);
      expect(processedItems[0]).toContain('Parent 1');
      expect(processedItems[0]).toContain('• Child 1');
      expect(processedItems[0]).toContain('• Child 2');
      expect(processedItems[1]).toContain('Parent 2');
      expect(processedItems[1]).toContain('• Child 3');
      expect(processedItems[1]).toContain('• Child 4');
    });
  });
  
  describe('determineBulletType', () => {
    it('should determine bullet type for unordered lists', () => {
      const list: ListResource = {
        items: ['Item 1', 'Item 2'],
        ordered: false
      };
      
      const bullet = listHandler.determineBulletType(list);
      
      expect(bullet.type).toBe('bullet');
      expect(bullet.code).toBe('•');
    });
    
    it('should determine bullet type for ordered lists with default numbering', () => {
      const list: ListResource = {
        items: ['Item 1', 'Item 2'],
        ordered: true
      };
      
      const bullet = listHandler.determineBulletType(list);
      
      expect(bullet.type).toBe('number');
      expect(bullet.numberType).toBe('decimal');
    });
    
    it('should determine bullet type for ordered lists with letter numbering', () => {
      const list: ListResource = {
        items: ['Item 1', 'Item 2'],
        ordered: true,
        style: {
          type: 'A'
        }
      };
      
      const bullet = listHandler.determineBulletType(list);
      
      expect(bullet.type).toBe('number');
      expect(bullet.numberType).toBe('upperLetter');
    });
    
    it('should handle start attribute for ordered lists', () => {
      const list: ListResource = {
        items: ['Item 1', 'Item 2'],
        ordered: true,
        style: {
          type: '1',
          start: '5'
        }
      };
      
      const bullet = listHandler.determineBulletType(list);
      
      expect(bullet.type).toBe('number');
      expect(bullet.startAt).toBe(5);
    });
  });
  
  describe('applyListStyling', () => {
    it('should apply basic list styling', () => {
      const list: ListResource = {
        items: ['Item 1', 'Item 2'],
        ordered: false
      };
      
      const styling = listHandler.applyListStyling(list);
      
      expect(styling.x).toBe(0.5);
      expect(styling.y).toBe(2);
      expect(styling.w).toBe('90%');
      expect(styling.fontSize).toBe(18);
      expect(styling.fontFace).toBe('Arial');
      expect(styling.color).toBe('333333');
      expect(styling.bullet.type).toBe('bullet');
    });
    
    it('should apply custom styling', () => {
      const list: ListResource = {
        items: ['Item 1', 'Item 2'],
        ordered: true,
        style: {
          type: 'A',
          start: '3',
          fontSize: '24pt',
          fontFamily: 'Times New Roman',
          color: '#FF0000',
          textAlign: 'center'
        }
      };
      
      const styling = listHandler.applyListStyling(list);
      
      expect(styling.fontSize).toBe(24);
      expect(styling.fontFace).toBe('Times New Roman');
      expect(styling.color).toBe('FF0000');
      expect(styling.align).toBe('center');
      expect(styling.bullet.type).toBe('number');
      expect(styling.bullet.numberType).toBe('upperLetter');
      expect(styling.bullet.startAt).toBe(3);
    });
    
    it('should convert font size from pixels to points', () => {
      const list: ListResource = {
        items: ['Item 1', 'Item 2'],
        ordered: false,
        style: {
          fontSize: '20px'
        }
      };
      
      const styling = listHandler.applyListStyling(list);
      
      expect(styling.fontSize).toBe(15); // 20px * 0.75 = 15pt
    });
  });
});