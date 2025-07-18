import { describe, it, expect } from 'vitest';
import { HTMLParser, HTMLParsingError } from '../../src/services/parser';
import { SplitStrategy } from '../../src/models';

describe('HTMLParser', () => {
  const parser = new HTMLParser();
  
  describe('validateHTML', () => {
    it('should return true for valid HTML', () => {
      const validHTML = '<html><head><title>Test</title></head><body><h1>Hello World</h1></body></html>';
      expect(parser.validateHTML(validHTML)).toBe(true);
    });
    
    it('should return true for HTML fragment', () => {
      const htmlFragment = '<div><h1>Hello World</h1><p>This is a test</p></div>';
      expect(parser.validateHTML(htmlFragment)).toBe(true);
    });
    
    it('should return false for empty string', () => {
      expect(parser.validateHTML('')).toBe(false);
    });
    
    it('should return false for non-string input', () => {
      // @ts-ignore - Testing invalid input type
      expect(parser.validateHTML(null)).toBe(false);
      // @ts-ignore - Testing invalid input type
      expect(parser.validateHTML(undefined)).toBe(false);
      // @ts-ignore - Testing invalid input type
      expect(parser.validateHTML(123)).toBe(false);
    });
    
    it('should return false for malformed HTML', () => {
      const malformedHTML = '<div><h1>Unclosed Tag';
      expect(parser.validateHTML(malformedHTML)).toBe(false);
    });
  });
  
  describe('getHTMLValidationError', () => {
    it('should return error message for empty string', () => {
      expect(parser.getHTMLValidationError('')).toBe('HTML content is empty or not a string');
    });
    
    it('should return error message for non-string input', () => {
      // @ts-ignore - Testing invalid input type
      expect(parser.getHTMLValidationError(null)).toBe('HTML content is empty or not a string');
    });
    
    it('should return error message for malformed HTML', () => {
      const malformedHTML = '<div><h1>Unclosed Tag';
      const errorMessage = parser.getHTMLValidationError(malformedHTML);
      expect(errorMessage).toBeTruthy();
      expect(typeof errorMessage).toBe('string');
    });
  });
  
  describe('parseHTML', () => {
    it('should parse valid HTML successfully', () => {
      const validHTML = '<html><head><title>Test</title></head><body><h1>Hello World</h1></body></html>';
      const result = parser.parseHTML(validHTML);
      
      expect(result).toBeDefined();
      expect(result.raw).toBe(validHTML);
      expect(result.parsed).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(result.resources).toBeDefined();
      expect(result.resources.images).toEqual([]);
      expect(result.resources.tables).toEqual([]);
      expect(result.resources.lists).toEqual([]);
      expect(result.resources.links).toEqual([]);
    });
    
    it('should parse HTML fragment successfully', () => {
      const htmlFragment = '<div><h1>Hello World</h1><p>This is a test</p></div>';
      const result = parser.parseHTML(htmlFragment);
      
      expect(result).toBeDefined();
      expect(result.raw).toBe(htmlFragment);
      expect(result.parsed).toBeDefined();
    });
    
    it('should throw HTMLParsingError for empty string', () => {
      expect(() => parser.parseHTML('')).toThrow(HTMLParsingError);
    });
    
    it('should throw HTMLParsingError for malformed HTML', () => {
      const malformedHTML = '<div><h1>Unclosed Tag';
      expect(() => parser.parseHTML(malformedHTML)).toThrow(HTMLParsingError);
    });
    
    it('should extract elements from HTML content', () => {
      const html = `
        <html>
          <body>
            <h1>Test Document</h1>
            <p>This is a test paragraph.</p>
            <img src="test.jpg" alt="Test Image" width="300" height="200">
            <table>
              <tr><th>Header 1</th><th>Header 2</th></tr>
              <tr><td>Cell 1</td><td>Cell 2</td></tr>
            </table>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </body>
        </html>
      `;
      
      const result = parser.parseHTML(html);
      
      // Check that resources were extracted
      expect(result.resources.images.length).toBeGreaterThan(0);
      expect(result.resources.tables.length).toBeGreaterThan(0);
      expect(result.resources.lists.length).toBeGreaterThan(0);
      
      // Check that section elements were populated
      expect(result.sections[0].elements.length).toBeGreaterThan(0);
      
      // Check that we have at least one of each element type in the section
      const elementTypes = result.sections[0].elements.map(el => el.type);
      expect(elementTypes).toContain('image');
      expect(elementTypes).toContain('table');
      expect(elementTypes).toContain('list');
    });
  });
  
  describe('extractSections', () => {
    it('should extract sections by H1 headings', () => {
      const html = `
        <html>
          <head><title>Test Document</title></head>
          <body>
            <h1>Section 1</h1>
            <p>Content for section 1</p>
            <h1>Section 2</h1>
            <p>Content for section 2</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </body>
        </html>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const sections = new HTMLParser().extractSections(doc, SplitStrategy.BY_H1);
      
      expect(sections).toHaveLength(2);
      expect(sections[0].title).toBe('Section 1');
      expect(sections[0].content).toContain('<h1>Section 1</h1>');
      expect(sections[0].content).toContain('<p>Content for section 1</p>');
      
      expect(sections[1].title).toBe('Section 2');
      expect(sections[1].content).toContain('<h1>Section 2</h1>');
      expect(sections[1].content).toContain('<p>Content for section 2</p>');
      expect(sections[1].content).toContain('<ul>');
    });
    
    it('should extract sections by H2 headings', () => {
      const html = `
        <html>
          <head><title>Test Document</title></head>
          <body>
            <h1>Main Title</h1>
            <p>Introduction</p>
            <h2>Section 1</h2>
            <p>Content for section 1</p>
            <h2>Section 2</h2>
            <p>Content for section 2</p>
          </body>
        </html>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const sections = new HTMLParser().extractSections(doc, SplitStrategy.BY_H2);
      
      expect(sections).toHaveLength(2);
      expect(sections[0].title).toBe('Section 1');
      expect(sections[0].content).toContain('<h2>Section 1</h2>');
      expect(sections[0].content).toContain('<p>Content for section 1</p>');
      
      expect(sections[1].title).toBe('Section 2');
      expect(sections[1].content).toContain('<h2>Section 2</h2>');
      expect(sections[1].content).toContain('<p>Content for section 2</p>');
    });
    
    it('should extract sections by custom selector', () => {
      const html = `
        <html>
          <head><title>Test Document</title></head>
          <body>
            <div class="intro">Introduction content</div>
            <div class="slide-section">
              <h3>Custom Section 1</h3>
              <p>Content for custom section 1</p>
            </div>
            <div class="slide-section">
              <h3>Custom Section 2</h3>
              <p>Content for custom section 2</p>
            </div>
          </body>
        </html>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const sections = new HTMLParser().extractSections(doc, SplitStrategy.BY_CUSTOM_SELECTOR, '.slide-section');
      
      expect(sections).toHaveLength(2);
      expect(sections[0].content).toContain('Custom Section 1');
      expect(sections[0].content).toContain('Content for custom section 1');
      
      expect(sections[1].content).toContain('Custom Section 2');
      expect(sections[1].content).toContain('Content for custom section 2');
    });
    
    it('should create a single section with NO_SPLIT strategy', () => {
      const html = `
        <html>
          <head><title>Test Document</title></head>
          <body>
            <h1>Main Title</h1>
            <p>Introduction</p>
            <h2>Section 1</h2>
            <p>Content for section 1</p>
            <h2>Section 2</h2>
            <p>Content for section 2</p>
          </body>
        </html>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const sections = new HTMLParser().extractSections(doc, SplitStrategy.NO_SPLIT);
      
      expect(sections).toHaveLength(1);
      expect(sections[0].title).toBe('Main Title');
      expect(sections[0].content).toContain('<h1>Main Title</h1>');
      expect(sections[0].content).toContain('<h2>Section 1</h2>');
      expect(sections[0].content).toContain('<h2>Section 2</h2>');
    });
    
    it('should create a single section when no matching headers are found', () => {
      const html = `
        <html>
          <head><title>Test Document</title></head>
          <body>
            <p>This is a paragraph without any headings</p>
            <div>This is a div without any headings</div>
          </body>
        </html>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const sections = new HTMLParser().extractSections(doc, SplitStrategy.BY_H1);
      
      expect(sections).toHaveLength(1);
      expect(sections[0].title).toBe('Untitled');
      expect(sections[0].content).toContain('<p>This is a paragraph without any headings</p>');
      expect(sections[0].content).toContain('<div>This is a div without any headings</div>');
    });
    
    it('should handle empty body gracefully', () => {
      const html = `
        <html>
          <head><title>Empty Document</title></head>
          <body></body>
        </html>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const sections = new HTMLParser().extractSections(doc, SplitStrategy.BY_H1);
      
      expect(sections).toHaveLength(1);
      expect(sections[0].title).toBe('Untitled');
      expect(sections[0].content).toBe('');
    });
  });
  
  describe('extractImages', () => {
    it('should extract images from HTML document', () => {
      const html = `
        <html>
          <body>
            <img src="test1.jpg" alt="Test Image 1" width="300" height="200">
            <div>
              <img src="test2.jpg" alt="Test Image 2">
              <img src="data:image/png;base64,abc123" alt="Data URL Image">
            </div>
          </body>
        </html>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const images = new HTMLParser().extractImages(doc);
      
      expect(images).toHaveLength(3);
      
      // Check first image
      expect(images[0].src).toBe('test1.jpg');
      expect(images[0].alt).toBe('Test Image 1');
      expect(images[0].width).toBe(300);
      expect(images[0].height).toBe(200);
      
      // Check second image
      expect(images[1].src).toBe('test2.jpg');
      expect(images[1].alt).toBe('Test Image 2');
      
      // Check data URL image
      expect(images[2].src).toBe('data:image/png;base64,abc123');
      expect(images[2].dataUrl).toBe('data:image/png;base64,abc123');
    });
    
    it('should skip images without src attribute', () => {
      const html = `
        <html>
          <body>
            <img alt="Missing Source">
            <img src="test.jpg" alt="Valid Image">
          </body>
        </html>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const images = new HTMLParser().extractImages(doc);
      
      expect(images).toHaveLength(1);
      expect(images[0].src).toBe('test.jpg');
    });
    
    it('should handle empty document gracefully', () => {
      const html = '<html><body></body></html>';
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const images = new HTMLParser().extractImages(doc);
      
      expect(images).toHaveLength(0);
    });
  });
  
  describe('extractTables', () => {
    it('should extract tables from HTML document', () => {
      const html = `
        <html>
          <body>
            <table border="1" cellpadding="5">
              <thead>
                <tr>
                  <th>Header 1</th>
                  <th>Header 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Row 1, Cell 1</td>
                  <td>Row 1, Cell 2</td>
                </tr>
                <tr>
                  <td>Row 2, Cell 1</td>
                  <td>Row 2, Cell 2</td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const tables = new HTMLParser().extractTables(doc);
      
      expect(tables).toHaveLength(1);
      
      // Check headers
      expect(tables[0].headers).toEqual(['Header 1', 'Header 2']);
      
      // Check rows
      expect(tables[0].rows).toHaveLength(2);
      expect(tables[0].rows[0]).toEqual(['Row 1, Cell 1', 'Row 1, Cell 2']);
      expect(tables[0].rows[1]).toEqual(['Row 2, Cell 1', 'Row 2, Cell 2']);
      
      // Check style
      expect(tables[0].style.border).toBe(true);
      expect(tables[0].style.cellPadding).toBe('5');
    });
    
    it('should handle tables without thead', () => {
      const html = `
        <html>
          <body>
            <table>
              <tr>
                <td>Header 1</td>
                <td>Header 2</td>
              </tr>
              <tr>
                <td>Row 1, Cell 1</td>
                <td>Row 1, Cell 2</td>
              </tr>
            </table>
          </body>
        </html>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const tables = new HTMLParser().extractTables(doc);
      
      expect(tables).toHaveLength(1);
      
      // Check headers (first row used as headers)
      expect(tables[0].headers).toEqual(['Header 1', 'Header 2']);
      
      // Check that rows are extracted correctly
      expect(tables[0].rows.length).toBeGreaterThan(0);
      expect(tables[0].rows).toContainEqual(['Row 1, Cell 1', 'Row 1, Cell 2']);
    });
    
    it('should handle empty document gracefully', () => {
      const html = '<html><body></body></html>';
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const tables = new HTMLParser().extractTables(doc);
      
      expect(tables).toHaveLength(0);
    });
  });
  
  describe('extractLists', () => {
    it('should extract unordered lists from HTML document', () => {
      const html = `
        <html>
          <body>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          </body>
        </html>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const lists = new HTMLParser().extractLists(doc);
      
      expect(lists).toHaveLength(1);
      
      // Check items
      expect(lists[0].items).toHaveLength(3);
      expect(lists[0].items[0]).toBe('Item 1');
      expect(lists[0].items[1]).toBe('Item 2');
      expect(lists[0].items[2]).toBe('Item 3');
      
      // Check type
      expect(lists[0].ordered).toBe(false);
      expect(lists[0].style.type).toBe('disc');
    });
    
    it('should extract ordered lists from HTML document', () => {
      const html = `
        <html>
          <body>
            <ol type="A" start="3">
              <li>Item A</li>
              <li>Item B</li>
              <li>Item C</li>
            </ol>
          </body>
        </html>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const lists = new HTMLParser().extractLists(doc);
      
      expect(lists).toHaveLength(1);
      
      // Check items
      expect(lists[0].items).toHaveLength(3);
      expect(lists[0].items[0]).toBe('Item A');
      expect(lists[0].items[1]).toBe('Item B');
      expect(lists[0].items[2]).toBe('Item C');
      
      // Check type
      expect(lists[0].ordered).toBe(true);
      expect(lists[0].style.type).toBe('A');
      expect(lists[0].style.start).toBe('3');
    });
    
    it('should preserve formatting within list items', () => {
      const html = `
        <html>
          <body>
            <ul>
              <li><strong>Bold</strong> text</li>
              <li>Text with <em>emphasis</em></li>
            </ul>
          </body>
        </html>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const lists = new HTMLParser().extractLists(doc);
      
      expect(lists).toHaveLength(1);
      
      // Check items with formatting
      expect(lists[0].items[0]).toContain('<strong>Bold</strong>');
      expect(lists[0].items[1]).toContain('<em>emphasis</em>');
    });
    
    it('should skip empty lists', () => {
      const html = `
        <html>
          <body>
            <ul></ul>
            <ol>
              <li>Valid Item</li>
            </ol>
          </body>
        </html>
      `;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const lists = new HTMLParser().extractLists(doc);
      
      expect(lists).toHaveLength(1);
      expect(lists[0].items).toHaveLength(1);
      expect(lists[0].items[0]).toBe('Valid Item');
    });
    
    it('should handle empty document gracefully', () => {
      const html = '<html><body></body></html>';
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const lists = new HTMLParser().extractLists(doc);
      
      expect(lists).toHaveLength(0);
    });
  });
});