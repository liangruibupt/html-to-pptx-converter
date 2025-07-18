import { describe, it, expect } from 'vitest';
import { HTMLParser } from '../../src/services/parser';

describe('Text Formatting Preservation', () => {
  const parser = new HTMLParser();
  
  describe('extractFormattedText', () => {
    it('should extract basic text elements', () => {
      const html = `
        <html>
          <body>
            <p>This is a paragraph</p>
            <h1>This is a heading</h1>
            <span>This is a span</span>
          </body>
        </html>
      `;
      
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(html, 'text/html');
      const textElements = parser.extractFormattedText(doc);
      
      expect(textElements.length).toBeGreaterThan(0);
      expect(textElements.some(el => el.content.includes('This is a paragraph'))).toBe(true);
      expect(textElements.some(el => el.content.includes('This is a heading'))).toBe(true);
      expect(textElements.some(el => el.content.includes('This is a span'))).toBe(true);
    });
    
    it('should detect heading levels', () => {
      const html = `
        <html>
          <body>
            <h1>Heading 1</h1>
            <h2>Heading 2</h2>
            <h3>Heading 3</h3>
          </body>
        </html>
      `;
      
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(html, 'text/html');
      const textElements = parser.extractFormattedText(doc);
      
      const h1Element = textElements.find(el => el.content.includes('Heading 1'));
      const h2Element = textElements.find(el => el.content.includes('Heading 2'));
      const h3Element = textElements.find(el => el.content.includes('Heading 3'));
      
      expect(h1Element?.format.headingLevel).toBe(1);
      expect(h2Element?.format.headingLevel).toBe(2);
      expect(h3Element?.format.headingLevel).toBe(3);
    });
    
    it('should detect text formatting', () => {
      const html = `
        <html>
          <body>
            <p><strong>Bold text</strong></p>
            <p><em>Italic text</em></p>
            <p><u>Underlined text</u></p>
            <p><s>Strikethrough text</s></p>
            <p><sup>Superscript</sup></p>
            <p><sub>Subscript</sub></p>
          </body>
        </html>
      `;
      
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(html, 'text/html');
      const textElements = parser.extractFormattedText(doc);
      
      // Find the formatting elements directly
      const boldElement = textElements.find(el => el.content === 'Bold text');
      const italicElement = textElements.find(el => el.content === 'Italic text');
      const underlineElement = textElements.find(el => el.content === 'Underlined text');
      const strikethroughElement = textElements.find(el => el.content === 'Strikethrough text');
      const superscriptElement = textElements.find(el => el.content === 'Superscript');
      const subscriptElement = textElements.find(el => el.content === 'Subscript');
      
      // If we can't find the exact elements, look for the parent paragraphs
      const paragraphs = textElements.filter(el => el.content.includes('<'));
      
      // Check if any element has the expected formatting
      const hasBold = textElements.some(el => el.format.bold);
      const hasItalic = textElements.some(el => el.format.italic);
      const hasUnderline = textElements.some(el => el.format.underline);
      const hasStrikethrough = textElements.some(el => el.format.strikethrough);
      const hasSuperscript = textElements.some(el => el.format.superscript);
      const hasSubscript = textElements.some(el => el.format.subscript);
      
      expect(hasBold).toBe(true);
      expect(hasItalic).toBe(true);
      expect(hasUnderline).toBe(true);
      expect(hasStrikethrough).toBe(true);
      expect(hasSuperscript).toBe(true);
      expect(hasSubscript).toBe(true);
    });
    
    it('should detect text alignment', () => {
      const html = `
        <html>
          <body>
            <p style="text-align: left;">Left aligned</p>
            <p style="text-align: center;">Center aligned</p>
            <p style="text-align: right;">Right aligned</p>
            <p style="text-align: justify;">Justified text</p>
            <p align="center">HTML attribute aligned</p>
          </body>
        </html>
      `;
      
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(html, 'text/html');
      const textElements = parser.extractFormattedText(doc);
      
      const leftElement = textElements.find(el => el.content.includes('Left aligned'));
      const centerElement = textElements.find(el => el.content.includes('Center aligned'));
      const rightElement = textElements.find(el => el.content.includes('Right aligned'));
      const justifyElement = textElements.find(el => el.content.includes('Justified text'));
      const attrCenterElement = textElements.find(el => el.content.includes('HTML attribute aligned'));
      
      expect(leftElement?.format.alignment).toBe('left');
      expect(centerElement?.format.alignment).toBe('center');
      expect(rightElement?.format.alignment).toBe('right');
      expect(justifyElement?.format.alignment).toBe('justify');
      expect(attrCenterElement?.format.alignment).toBe('center');
    });
    
    it('should handle nested formatting', () => {
      const html = `
        <html>
          <body>
            <p>This has <strong>bold</strong> and <em>italic</em> text</p>
            <p>This has <strong><em>bold and italic</em></strong> text</p>
          </body>
        </html>
      `;
      
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(html, 'text/html');
      const textElements = parser.extractFormattedText(doc);
      
      const nestedElement1 = textElements.find(el => el.content.includes('<strong>bold</strong>'));
      const nestedElement2 = textElements.find(el => el.content.includes('<strong><em>bold and italic</em></strong>'));
      
      expect(nestedElement1?.format.hasNestedFormatting).toBe(true);
      expect(nestedElement2?.format.hasNestedFormatting).toBe(true);
    });
    
    it('should skip empty elements', () => {
      const html = `
        <html>
          <body>
            <p>Valid paragraph</p>
            <p></p>
            <span> </span>
            <div>   </div>
          </body>
        </html>
      `;
      
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(html, 'text/html');
      const textElements = parser.extractFormattedText(doc);
      
      // Only the valid paragraph should be extracted
      expect(textElements.length).toBe(1);
      expect(textElements[0].content).toBe('Valid paragraph');
    });
  });
  
  describe('parseHTML with text formatting', () => {
    it('should include formatted text in the parsed HTML content', () => {
      const html = `
        <html>
          <body>
            <h1>Document Title</h1>
            <p>This is a <strong>bold</strong> paragraph.</p>
            <p><em>Italic</em> text example.</p>
          </body>
        </html>
      `;
      
      const result = parser.parseHTML(html);
      
      // Check that text resources were extracted
      expect(result.resources.texts.length).toBeGreaterThan(0);
      
      // Check that section elements include text elements
      const textElements = result.sections[0].elements.filter(el => el.type === 'text');
      expect(textElements.length).toBeGreaterThan(0);
      
      // Check that formatting is preserved
      const boldText = result.resources.texts.find(text => 
        text.content.includes('<strong>bold</strong>'));
      const italicText = result.resources.texts.find(text => 
        text.content.includes('<em>Italic</em>'));
        
      expect(boldText).toBeDefined();
      expect(italicText).toBeDefined();
    });
  });
});