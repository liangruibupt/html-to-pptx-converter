import { ListResource } from '../../models';
import { ListHandlerService, ListHandlingError } from './ListHandlerInterface';

/**
 * List Handler Service Implementation
 * 
 * This service processes and optimizes lists for PPTX slides.
 * 
 * Requirements:
 * - 3.5: Handle tables and lists appropriately in the PPTX output
 */
export class ListHandler implements ListHandlerService {
  /**
   * Process a list for PPTX output
   * 
   * @param list - The list resource to process
   * @returns Processed list resource
   */
  processList(list: ListResource): ListResource {
    try {
      // Create a deep copy of the list to avoid modifying the original
      const processedList: ListResource = {
        items: [...list.items],
        ordered: list.ordered,
        style: list.style ? { ...list.style } : {}
      };
      
      // Format list items (strip HTML tags, handle nested lists, etc.)
      processedList.items = this.formatListItems(processedList.items, processedList.ordered);
      
      // Apply default styling if not present
      if (!processedList.style) {
        processedList.style = {};
      }
      
      // Ensure style has necessary properties
      processedList.style = {
        ...processedList.style,
        type: processedList.style.type || (processedList.ordered ? '1' : 'disc'),
        start: processedList.style.start || '1',
        fontSize: processedList.style.fontSize || '12pt',
        fontFamily: processedList.style.fontFamily || 'Arial',
        color: processedList.style.color || '#000000',
        textAlign: processedList.style.textAlign || 'left'
      };
      
      return processedList;
    } catch (error) {
      throw new ListHandlingError(
        `Failed to process list: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Format list items
   * 
   * @param items - The list items to format
   * @param ordered - Whether the list is ordered
   * @returns Formatted list items
   */
  formatListItems(items: string[], ordered: boolean): string[] {
    try {
      // Process each item
      return items.map(item => {
        // Strip HTML tags but preserve basic formatting
        const formattedItem = this.stripHtmlPreserveFormatting(item);
        
        // Handle nested lists by adding proper indentation
        return this.processNestedListItem(formattedItem);
      });
    } catch (error) {
      throw new ListHandlingError(
        `Failed to format list items: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Strip HTML tags but preserve basic formatting
   * 
   * @param html - HTML content to strip tags from
   * @returns Text content with basic formatting preserved
   */
  private stripHtmlPreserveFormatting(html: string): string {
    try {
      // Create a temporary element to parse the HTML
      const tempElement = document.createElement('div');
      tempElement.innerHTML = html;
      
      // Replace <br> tags with newlines
      const brTags = tempElement.querySelectorAll('br');
      brTags.forEach(br => br.replaceWith('\n'));
      
      // Replace <p> tags with double newlines
      const pTags = tempElement.querySelectorAll('p');
      pTags.forEach(p => {
        const text = p.textContent || '';
        p.replaceWith(`${text}\n\n`);
      });
      
      // Get text content
      let text = tempElement.textContent || '';
      
      // Remove extra whitespace
      text = text.replace(/\s+/g, ' ').trim();
      
      return text;
    } catch (error) {
      throw new ListHandlingError(
        `Failed to strip HTML: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Process a list item that may contain nested lists
   * 
   * @param item - The list item to process
   * @returns Processed list item with proper indentation for nested lists
   */
  private processNestedListItem(item: string): string {
    // Check if the item contains nested list markers
    const nestedUlPattern = /<ul>/i;
    const nestedOlPattern = /<ol>/i;
    
    if (nestedUlPattern.test(item) || nestedOlPattern.test(item)) {
      // Extract the main content (before the nested list)
      const mainContent = item.split(/<ul>|<ol>/i)[0].trim();
      
      // Extract nested list items
      const nestedItems = this.extractNestedListItems(item);
      
      // Combine main content with indented nested items
      return [
        mainContent,
        ...nestedItems.map(nestedItem => `    • ${nestedItem}`) // Add indentation and bullet
      ].join('\n');
    }
    
    return item;
  }
  
  /**
   * Extract nested list items from HTML
   * 
   * @param html - HTML content containing nested lists
   * @returns Array of nested list items
   */
  private extractNestedListItems(html: string): string[] {
    try {
      // Create a temporary element to parse the HTML
      const tempElement = document.createElement('div');
      tempElement.innerHTML = html;
      
      // Find all nested lists
      const nestedLists = tempElement.querySelectorAll('ul, ol');
      
      // Extract items from all nested lists
      const nestedItems: string[] = [];
      
      nestedLists.forEach(list => {
        const items = list.querySelectorAll('li');
        items.forEach(item => {
          nestedItems.push(item.textContent || '');
        });
      });
      
      return nestedItems;
    } catch (error) {
      return []; // Return empty array if extraction fails
    }
  }
  
  /**
   * Handle nested lists
   * 
   * @param items - The list items that may contain nested lists
   * @returns Processed list items with proper indentation for nested lists
   */
  handleNestedLists(items: string[]): string[] {
    try {
      return items.map(item => this.processNestedListItem(item));
    } catch (error) {
      throw new ListHandlingError(
        `Failed to handle nested lists: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Determine bullet type based on list style
   * 
   * @param list - The list resource
   * @returns Bullet configuration object
   */
  determineBulletType(list: ListResource): Record<string, any> {
    try {
      // Default bullet for unordered lists
      if (!list.ordered) {
        return { type: 'bullet', code: '•' };
      }
      
      // Configuration for ordered lists
      const bullet: Record<string, any> = { type: 'number' };
      
      // Handle different list types (A, B, C or 1, 2, 3)
      if (list.style?.type) {
        switch (list.style.type) {
          case 'A':
            bullet.numberType = 'upperLetter';
            break;
          case 'a':
            bullet.numberType = 'lowerLetter';
            break;
          case 'I':
            bullet.numberType = 'upperRoman';
            break;
          case 'i':
            bullet.numberType = 'lowerRoman';
            break;
          case '1':
          default:
            bullet.numberType = 'decimal';
            break;
        }
      } else {
        // Default to decimal for ordered lists with no type specified
        bullet.numberType = 'decimal';
      }
      
      // Handle start attribute
      if (list.style?.start && list.style.start !== '1') {
        bullet.startAt = parseInt(list.style.start, 10);
      }
      
      return bullet;
    } catch (error) {
      throw new ListHandlingError(
        `Failed to determine bullet type: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Apply list styling
   * 
   * @param list - The list resource
   * @returns List with applied styling
   */
  applyListStyling(list: ListResource): Record<string, any> {
    try {
      const listStyle = list.style || {};
      
      // Determine bullet type
      const bullet = this.determineBulletType(list);
      
      // Convert font size from CSS to points if needed
      let fontSize = 18; // Default font size
      if (listStyle.fontSize) {
        const fontSizeMatch = listStyle.fontSize.match(/(\d+)(pt|px)?/);
        if (fontSizeMatch) {
          const size = parseInt(fontSizeMatch[1], 10);
          const unit = fontSizeMatch[2] || 'px';
          
          // Convert to points if necessary
          fontSize = unit === 'px' ? Math.round(size * 0.75) : size;
        }
      }
      
      // Convert color from CSS to PowerPoint format
      let color = '333333'; // Default color
      if (listStyle.color && listStyle.color.startsWith('#')) {
        color = listStyle.color.substring(1);
      }
      
      // Default list options
      const listOptions: Record<string, any> = {
        x: 0.5,
        y: 2,
        w: '90%',
        h: 2,
        fontSize: fontSize,
        fontFace: listStyle.fontFamily || 'Arial',
        color: color,
        bullet: bullet,
        align: listStyle.textAlign || 'left'
      };
      
      return listOptions;
    } catch (error) {
      throw new ListHandlingError(
        `Failed to apply list styling: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}