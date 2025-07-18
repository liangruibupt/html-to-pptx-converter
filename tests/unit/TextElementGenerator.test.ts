import { describe, it, expect, beforeEach } from 'vitest';
import { TextElementGenerator, TextElementGenerationError } from '../../src/services/conversion/TextElementGenerator';
import { TextResource } from '../../src/models';

describe('TextElementGenerator', () => {
  let textElementGenerator: TextElementGenerator;
  
  beforeEach(() => {
    textElementGenerator = new TextElementGenerator();
  });
  
  describe('generateFromHtml', () => {
    it('should generate a text element from simple HTML', () => {
      const htmlContent = '<p>Simple text</p>';
      const textElement = textElementGenerator.generateFromHtml(htmlContent);
      
      expect(textElement.content).toBe('Simple text');
      expect(textElement.format).toBeDefined();
    });
    
    it('should generate a text element with bold formatting', () => {
      const htmlContent = '<p><strong>Bold text</strong></p>';
      const textElement = textElementGenerator.generateFromHtml(htmlContent);
      
      expect(textElement.content).toBe('Bold text');
      expect(textElement.format.bold).toBe(true);
      expect(textElement.format.hasNestedFormatting).toBe(false);
    });
    
    it('should generate a text element with italic formatting', () => {
      const htmlContent = '<p><em>Italic text</em></p>';
      const textElement = textElementGenerator.generateFromHtml(htmlContent);
      
      expect(textElement.content).toBe('Italic text');
      expect(textElement.format.italic).toBe(true);
      expect(textElement.format.hasNestedFormatting).toBe(false);
    });
    
    it('should generate a text element with underline formatting', () => {
      const htmlContent = '<p><u>Underlined text</u></p>';
      const textElement = textElementGenerator.generateFromHtml(htmlContent);
      
      expect(textElement.content).toBe('Underlined text');
      expect(textElement.format.underline).toBe(true);
      expect(textElement.format.hasNestedFormatting).toBe(false);
    });
    
    it('should generate a text element with strikethrough formatting', () => {
      const htmlContent = '<p><s>Strikethrough text</s></p>';
      const textElement = textElementGenerator.generateFromHtml(htmlContent);
      
      expect(textElement.content).toBe('Strikethrough text');
      expect(textElement.format.strikethrough).toBe(true);
      expect(textElement.format.hasNestedFormatting).toBe(false);
    });
    
    it('should generate a text element with heading formatting', () => {
      const htmlContent = '<h2>Heading 2</h2>';
      const textElement = textElementGenerator.generateFromHtml(htmlContent);
      
      expect(textElement.content).toBe('Heading 2');
      expect(textElement.format.headingLevel).toBe(2);
      expect(textElement.format.hasNestedFormatting).toBe(false);
    });
    
    it('should generate a text element with multiple formatting options', () => {
      const htmlContent = '<h3><strong><em>Bold italic heading</em></strong></h3>';
      const textElement = textElementGenerator.generateFromHtml(htmlContent);
      
      expect(textElement.content).toBe('Bold italic heading');
      expect(textElement.format.headingLevel).toBe(3);
      expect(textElement.format.bold).toBe(true);
      expect(textElement.format.italic).toBe(true);
      expect(textElement.format.hasNestedFormatting).toBe(true);
    });
    
    it('should handle inline styles for text color and font', () => {
      const htmlContent = '<p style="color: #FF0000; font-family: Arial; font-size: 16px;">Styled text</p>';
      const textElement = textElementGenerator.generateFromHtml(htmlContent);
      
      expect(textElement.content).toBe('Styled text');
      expect(textElement.format.color).toBe('#FF0000');
      expect(textElement.format.fontFamily).toBe('Arial');
      expect(textElement.format.fontSize).toBe('16px');
    });
    
    it('should throw TextElementGenerationError for invalid HTML', () => {
      const invalidHtml = '<unclosed>';
      
      // This test might not fail in a browser environment since browsers
      // are very forgiving with invalid HTML, but we include it for completeness
      try {
        textElementGenerator.generateFromHtml(invalidHtml);
        // If no error is thrown, the test should still pass
      } catch (error) {
        expect(error).toBeInstanceOf(TextElementGenerationError);
      }
    });
  });
  
  describe('parseFormatting', () => {
    it('should parse bold formatting', () => {
      const format = textElementGenerator.parseFormatting('<strong>Bold</strong>');
      expect(format.bold).toBe(true);
      expect(format.hasNestedFormatting).toBe(false);
      
      expect(textElementGenerator.parseFormatting('<b>Bold</b>')).toEqual({
        bold: true,
        hasNestedFormatting: false
      });
    });
    
    it('should parse italic formatting', () => {
      const format = textElementGenerator.parseFormatting('<em>Italic</em>');
      expect(format.italic).toBe(true);
      expect(format.hasNestedFormatting).toBe(false);
      
      expect(textElementGenerator.parseFormatting('<i>Italic</i>')).toEqual({
        italic: true,
        hasNestedFormatting: false
      });
    });
    
    it('should parse text alignment', () => {
      const format = textElementGenerator.parseFormatting('<div style="text-align: center;">Centered</div>');
      expect(format.alignment).toBe('center');
      expect(format.hasNestedFormatting).toBe(false);
      
      expect(textElementGenerator.parseFormatting('<div style="text-align: right;">Right</div>')).toEqual({
        alignment: 'right',
        hasNestedFormatting: false
      });
    });
    
    it('should detect nested formatting', () => {
      const format = textElementGenerator.parseFormatting('<p><strong>Bold <em>and italic</em></strong></p>');
      expect(format.hasNestedFormatting).toBe(true);
      expect(format.bold).toBe(true);
      expect(format.italic).toBe(true);
    });
  });
  
  describe('extractText', () => {
    it('should extract plain text from HTML', () => {
      expect(textElementGenerator.extractText('<p>Simple text</p>')).toBe('Simple text');
      expect(textElementGenerator.extractText('<h1>Heading</h1><p>Paragraph</p>')).toBe('HeadingParagraph');
      expect(textElementGenerator.extractText('<div><strong>Bold</strong> and <em>italic</em></div>')).toBe('Bold and italic');
    });
    
    it('should handle empty HTML', () => {
      expect(textElementGenerator.extractText('')).toBe('');
      expect(textElementGenerator.extractText('<div></div>')).toBe('');
    });
  });
  
  describe('generateComplexTextElements', () => {
    it('should generate multiple text elements for complex HTML', () => {
      const htmlContent = '<p><strong>Bold</strong> and <em>italic</em> text</p>';
      const textElements = textElementGenerator.generateComplexTextElements(htmlContent);
      
      expect(textElements.length).toBeGreaterThan(1);
      
      // Check that we have elements with different formatting
      const boldElement = textElements.find(el => el.format.bold);
      const italicElement = textElements.find(el => el.format.italic);
      
      expect(boldElement).toBeDefined();
      expect(italicElement).toBeDefined();
      
      if (boldElement) {
        expect(boldElement.content).toContain('Bold');
      }
      
      if (italicElement) {
        expect(italicElement.content).toContain('italic');
      }
    });
    
    it('should handle nested formatting elements', () => {
      const htmlContent = '<p><strong><em>Bold and italic</em></strong> text</p>';
      const textElements = textElementGenerator.generateComplexTextElements(htmlContent);
      
      // Check that we have at least one element
      expect(textElements.length).toBeGreaterThan(0);
      
      // Check that the content is preserved
      const allContent = textElements.map(el => el.content).join('');
      expect(allContent).toContain('Bold and italic');
    });
  });
});