import { TextResource } from '../../models';

/**
 * Text Element Generator Interface
 * 
 * This interface defines the methods for generating text elements for PPTX slides.
 */
export interface TextElementGeneratorService {
  /**
   * Generate a text element from HTML content
   * 
   * @param htmlContent - HTML content to generate text element from
   * @returns Text resource object
   */
  generateFromHtml(htmlContent: string): TextResource;
  
  /**
   * Parse text formatting from HTML
   * 
   * @param htmlContent - HTML content to parse formatting from
   * @returns Text format object
   */
  parseFormatting(htmlContent: string): TextResource['format'];
  
  /**
   * Extract plain text from HTML
   * 
   * @param htmlContent - HTML content to extract text from
   * @returns Plain text content
   */
  extractText(htmlContent: string): string;
}

/**
 * Text element generation error class
 * 
 * Custom error class for text element generation errors
 */
export class TextElementGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TextElementGenerationError';
  }
}

/**
 * Text Element Generator Implementation
 * 
 * This service generates text elements for PPTX slides from HTML content.
 * 
 * Requirements:
 * - 3.2: Preserve text formatting (bold, italic, underline, etc.) in the PPTX output
 */
export class TextElementGenerator implements TextElementGeneratorService {
  /**
   * Generate a text element from HTML content
   * 
   * @param htmlContent - HTML content to generate text element from
   * @returns Text resource object
   */
  generateFromHtml(htmlContent: string): TextResource {
    try {
      // Parse formatting from HTML
      const format = this.parseFormatting(htmlContent);
      
      // Extract plain text from HTML
      const content = this.extractText(htmlContent);
      
      // Create and return text resource
      return {
        content,
        format
      };
    } catch (error) {
      throw new TextElementGenerationError(
        `Failed to generate text element: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Parse text formatting from HTML
   * 
   * @param htmlContent - HTML content to parse formatting from
   * @returns Text format object
   */
  parseFormatting(htmlContent: string): TextResource['format'] {
    try {
      // Create a temporary element to parse the HTML
      const tempElement = document.createElement('div');
      tempElement.innerHTML = htmlContent;
      
      // Initialize format object
      const format: TextResource['format'] = {};
      
      // Check for heading level
      const headingMatch = tempElement.querySelector('h1, h2, h3, h4, h5, h6');
      if (headingMatch) {
        const tagName = headingMatch.tagName.toLowerCase();
        format.headingLevel = parseInt(tagName.substring(1), 10);
      }
      
      // Check for basic formatting - only add properties if they are true
      const hasBold = !!tempElement.querySelector('strong, b') || 
                      tempElement.innerHTML.includes('<strong>') || 
                      tempElement.innerHTML.includes('<b>');
      if (hasBold) {
        format.bold = true;
      }
      
      const hasItalic = !!tempElement.querySelector('em, i') || 
                        tempElement.innerHTML.includes('<em>') || 
                        tempElement.innerHTML.includes('<i>');
      if (hasItalic) {
        format.italic = true;
      }
      
      const hasUnderline = !!tempElement.querySelector('u') || 
                           tempElement.innerHTML.includes('<u>');
      if (hasUnderline) {
        format.underline = true;
      }
      
      const hasStrikethrough = !!tempElement.querySelector('s, strike, del') || 
                               tempElement.innerHTML.includes('<s>') || 
                               tempElement.innerHTML.includes('<strike>') || 
                               tempElement.innerHTML.includes('<del>');
      if (hasStrikethrough) {
        format.strikethrough = true;
      }
      
      // Check for superscript and subscript
      const hasSuperscript = !!tempElement.querySelector('sup') || 
                             tempElement.innerHTML.includes('<sup>');
      if (hasSuperscript) {
        format.superscript = true;
      }
      
      const hasSubscript = !!tempElement.querySelector('sub') || 
                           tempElement.innerHTML.includes('<sub>');
      if (hasSubscript) {
        format.subscript = true;
      }
      
      // Check for text alignment
      if (tempElement.style.textAlign) {
        format.alignment = tempElement.style.textAlign as any;
      } else if (tempElement.querySelector('[style*="text-align"]')) {
        const alignedElement = tempElement.querySelector('[style*="text-align"]');
        const alignStyle = alignedElement?.getAttribute('style');
        if (alignStyle) {
          const alignMatch = alignStyle.match(/text-align:\s*(\w+)/);
          if (alignMatch && alignMatch[1]) {
            format.alignment = alignMatch[1] as any;
          }
        }
      }
      
      // Check for font family
      if (tempElement.style.fontFamily) {
        format.fontFamily = tempElement.style.fontFamily;
      } else if (tempElement.querySelector('[style*="font-family"]')) {
        const fontElement = tempElement.querySelector('[style*="font-family"]');
        const fontStyle = fontElement?.getAttribute('style');
        if (fontStyle) {
          const fontMatch = fontStyle.match(/font-family:\s*([^;]+)/);
          if (fontMatch && fontMatch[1]) {
            format.fontFamily = fontMatch[1].trim();
          }
        }
      }
      
      // Check for font size
      if (tempElement.style.fontSize) {
        format.fontSize = tempElement.style.fontSize;
      } else if (tempElement.querySelector('[style*="font-size"]')) {
        const sizeElement = tempElement.querySelector('[style*="font-size"]');
        const sizeStyle = sizeElement?.getAttribute('style');
        if (sizeStyle) {
          const sizeMatch = sizeStyle.match(/font-size:\s*([^;]+)/);
          if (sizeMatch && sizeMatch[1]) {
            format.fontSize = sizeMatch[1].trim();
          }
        }
      }
      
      // Check for text color
      if (tempElement.style.color) {
        format.color = tempElement.style.color;
      } else if (tempElement.querySelector('[style*="color:"]')) {
        const colorElement = tempElement.querySelector('[style*="color:"]');
        const colorStyle = colorElement?.getAttribute('style');
        if (colorStyle) {
          const colorMatch = colorStyle.match(/color:\s*([^;]+)/);
          if (colorMatch && colorMatch[1]) {
            format.color = colorMatch[1].trim();
          }
        }
      }
      
      // Check for background color
      if (tempElement.style.backgroundColor) {
        format.backgroundColor = tempElement.style.backgroundColor;
      } else if (tempElement.querySelector('[style*="background-color"]')) {
        const bgElement = tempElement.querySelector('[style*="background-color"]');
        const bgStyle = bgElement?.getAttribute('style');
        if (bgStyle) {
          const bgMatch = bgStyle.match(/background-color:\s*([^;]+)/);
          if (bgMatch && bgMatch[1]) {
            format.backgroundColor = bgMatch[1].trim();
          }
        }
      }
      
      // Check if there's nested formatting
      format.hasNestedFormatting = tempElement.querySelectorAll('strong, b, em, i, u, s, strike, del, sup, sub').length > 1;
      
      return format;
    } catch (error) {
      throw new TextElementGenerationError(
        `Failed to parse text formatting: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Extract plain text from HTML
   * 
   * @param htmlContent - HTML content to extract text from
   * @returns Plain text content
   */
  extractText(htmlContent: string): string {
    try {
      // Create a temporary element to parse the HTML
      const tempElement = document.createElement('div');
      tempElement.innerHTML = htmlContent;
      
      // Get text content
      return tempElement.textContent || tempElement.innerText || '';
    } catch (error) {
      throw new TextElementGenerationError(
        `Failed to extract text: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Generate text elements from complex HTML with mixed formatting
   * 
   * @param htmlContent - Complex HTML content with mixed formatting
   * @returns Array of text resources with different formatting
   */
  generateComplexTextElements(htmlContent: string): TextResource[] {
    try {
      // Create a temporary element to parse the HTML
      const tempElement = document.createElement('div');
      tempElement.innerHTML = htmlContent;
      
      // Initialize result array
      const textElements: TextResource[] = [];
      
      // Process each child node
      this.processNodeForTextElements(tempElement, textElements);
      
      return textElements;
    } catch (error) {
      throw new TextElementGenerationError(
        `Failed to generate complex text elements: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Process a node recursively to extract text elements
   * 
   * @param node - Node to process
   * @param textElements - Array to add text elements to
   */
  private processNodeForTextElements(node: Node, textElements: TextResource[]): void {
    // Skip empty nodes
    if (!node.textContent?.trim()) {
      return;
    }
    
    // Process text nodes
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      // Get parent element for formatting
      const parentElement = node.parentElement;
      if (parentElement) {
        const format = this.getNodeFormatting(parentElement);
        textElements.push({
          content: node.textContent,
          format
        });
      } else {
        textElements.push({
          content: node.textContent,
          format: {}
        });
      }
      return;
    }
    
    // Process element nodes with children
    if (node.nodeType === Node.ELEMENT_NODE) {
      // Check if this is a formatting element with a single text node
      const element = node as Element;
      if (element.childNodes.length === 1 && element.firstChild?.nodeType === Node.TEXT_NODE) {
        const format = this.getNodeFormatting(element);
        textElements.push({
          content: element.textContent || '',
          format
        });
        return;
      }
      
      // Process child nodes recursively
      node.childNodes.forEach(childNode => {
        this.processNodeForTextElements(childNode, textElements);
      });
    }
  }
  
  /**
   * Get formatting information from a node
   * 
   * @param element - Element to get formatting from
   * @returns Text format object
   */
  private getNodeFormatting(element: Element): TextResource['format'] {
    const format: TextResource['format'] = {};
    
    // Check element tag name for basic formatting
    const tagName = element.tagName.toLowerCase();
    
    // Check for heading level
    if (tagName.match(/^h[1-6]$/)) {
      format.headingLevel = parseInt(tagName.substring(1), 10);
    }
    
    // Check for basic formatting based on tag name
    format.bold = ['strong', 'b'].includes(tagName) || false;
    format.italic = ['em', 'i'].includes(tagName) || false;
    format.underline = tagName === 'u' || false;
    format.strikethrough = ['s', 'strike', 'del'].includes(tagName) || false;
    format.superscript = tagName === 'sup' || false;
    format.subscript = tagName === 'sub' || false;
    
    // Check for inline styles
    const style = element.getAttribute('style');
    if (style) {
      // Check for text alignment
      const alignMatch = style.match(/text-align:\s*(\w+)/);
      if (alignMatch && alignMatch[1]) {
        format.alignment = alignMatch[1] as any;
      }
      
      // Check for font family
      const fontMatch = style.match(/font-family:\s*([^;]+)/);
      if (fontMatch && fontMatch[1]) {
        format.fontFamily = fontMatch[1].trim();
      }
      
      // Check for font size
      const sizeMatch = style.match(/font-size:\s*([^;]+)/);
      if (sizeMatch && sizeMatch[1]) {
        format.fontSize = sizeMatch[1].trim();
      }
      
      // Check for text color
      const colorMatch = style.match(/color:\s*([^;]+)/);
      if (colorMatch && colorMatch[1]) {
        format.color = colorMatch[1].trim();
      }
      
      // Check for background color
      const bgMatch = style.match(/background-color:\s*([^;]+)/);
      if (bgMatch && bgMatch[1]) {
        format.backgroundColor = bgMatch[1].trim();
      }
    }
    
    return format;
  }
}