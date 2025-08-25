import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HTMLParser, HTMLParsingError } from '../../src/services/parser';
import { SplitStrategy } from '../../src/models';

// Mock DOM APIs
const mockDOMParser = vi.fn();
const mockElement = {
  innerHTML: '',
  textContent: '',
  getAttribute: vi.fn(),
  querySelectorAll: vi.fn(),
  querySelector: vi.fn(),
  tagName: 'DIV',
  children: [],
  parentNode: null,
  cloneNode: vi.fn(),
  appendChild: vi.fn()
};

const mockDocumentFragment = {
  appendChild: vi.fn(),
  querySelectorAll: vi.fn(),
  querySelector: vi.fn()
};

const mockDocument = {
  createElement: vi.fn(),
  querySelectorAll: vi.fn(),
  querySelector: vi.fn(),
  createDocumentFragment: vi.fn(),
  documentElement: mockElement,
  body: {
    innerHTML: '',
    querySelectorAll: vi.fn(),
    querySelector: vi.fn()
  }
};

// Setup global mocks
global.DOMParser = mockDOMParser;
global.document = mockDocument as any;

describe('HTMLParser', () => {
  let parser: HTMLParser;

  beforeEach(() => {
    parser = new HTMLParser();
    
    // Reset mocks
    mockDOMParser.mockClear();
    mockDocument.createElement.mockReturnValue(mockElement);
    mockDocument.querySelectorAll.mockReturnValue([]);
    mockDocument.querySelector.mockReturnValue(null);
    mockDocument.createDocumentFragment.mockReturnValue(mockDocumentFragment);
    mockElement.cloneNode.mockReturnValue(mockElement);
    mockElement.querySelectorAll.mockReturnValue([]);
    mockElement.querySelector.mockReturnValue(null);
    
    // Mock DOMParser instance
    const mockParserInstance = {
      parseFromString: vi.fn().mockReturnValue(mockDocument)
    };
    mockDOMParser.mockImplementation(() => mockParserInstance);
  });

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
      expect(errorMessage).toContain('Invalid HTML structure');
    });
  });
  
  describe('parseHTML', () => {
    it('should parse valid HTML successfully', () => {
      const validHTML = '<html><body><h1>Test</h1><p>Content</p></body></html>';
      
      const result = parser.parseHTML(validHTML);
      
      expect(result).toBeDefined();
      expect(mockDOMParser).toHaveBeenCalled();
    });
    
    it('should parse HTML fragment successfully', () => {
      const htmlFragment = '<div><h1>Hello World</h1><p>This is a test</p></div>';
      
      const result = parser.parseHTML(htmlFragment);
      
      expect(result).toBeDefined();
      expect(mockDOMParser).toHaveBeenCalled();
    });
    
    it('should throw HTMLParsingError for empty string', () => {
      expect(() => {
        parser.parseHTML('');
      }).toThrow(HTMLParsingError);
    });
    
    it('should throw HTMLParsingError for malformed HTML', () => {
      const malformedHTML = '<div><h1>Unclosed Tag';
      
      expect(() => {
        parser.parseHTML(malformedHTML);
      }).toThrow(HTMLParsingError);
    });
    
    it('should extract elements from HTML content', () => {
      const html = `
        <html>
          <body>
            <h1>Title</h1>
            <p>Paragraph</p>
            <img src="test.jpg" alt="Test Image">
            <table>
              <tr><td>Cell</td></tr>
            </table>
          </body>
        </html>
      `;
      
      const result = parser.parseHTML(html);
      
      expect(result).toBeDefined();
      expect(mockDOMParser).toHaveBeenCalled();
    });
  });
  
  describe('extractSections', () => {
    beforeEach(() => {
      // Mock querySelectorAll for section extraction
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'h1') {
          return [
            { textContent: 'Section 1', tagName: 'H1' },
            { textContent: 'Section 2', tagName: 'H1' }
          ];
        }
        return [];
      });
    });

    it('should extract sections by H1 headings', () => {
      const html = `
        <html>
          <body>
            <h1>Section 1</h1>
            <p>Content 1</p>
            <h1>Section 2</h1>
            <p>Content 2</p>
          </body>
        </html>
      `;
      
      const doc = parser.parseHTML(html);
      const sections = parser.extractSections(doc, SplitStrategy.H1);
      
      expect(sections).toBeDefined();
      expect(Array.isArray(sections)).toBe(true);
    });
    
    it('should extract sections by H2 headings', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'h2') {
          return [
            { textContent: 'Subsection 1', tagName: 'H2' },
            { textContent: 'Subsection 2', tagName: 'H2' }
          ];
        }
        return [];
      });

      const html = `
        <html>
          <body>
            <h2>Subsection 1</h2>
            <p>Content 1</p>
            <h2>Subsection 2</h2>
            <p>Content 2</p>
          </body>
        </html>
      `;
      
      const doc = parser.parseHTML(html);
      const sections = parser.extractSections(doc, SplitStrategy.H2);
      
      expect(sections).toBeDefined();
      expect(Array.isArray(sections)).toBe(true);
    });
    
    it('should extract sections by custom selector', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '.section') {
          return [
            { textContent: 'Custom Section 1', className: 'section' },
            { textContent: 'Custom Section 2', className: 'section' }
          ];
        }
        return [];
      });

      const html = `
        <html>
          <body>
            <div class="section">Custom Section 1</div>
            <p>Content 1</p>
            <div class="section">Custom Section 2</div>
            <p>Content 2</p>
          </body>
        </html>
      `;
      
      const doc = parser.parseHTML(html);
      const sections = parser.extractSections(doc, SplitStrategy.CUSTOM, '.section');
      
      expect(sections).toBeDefined();
      expect(Array.isArray(sections)).toBe(true);
    });
    
    it('should create a single section with NO_SPLIT strategy', () => {
      const html = `
        <html>
          <body>
            <h1>Title</h1>
            <p>All content in one section</p>
            <h2>Subtitle</h2>
            <p>More content</p>
          </body>
        </html>
      `;
      
      const doc = parser.parseHTML(html);
      const sections = parser.extractSections(doc, SplitStrategy.NO_SPLIT);
      
      expect(sections).toBeDefined();
      expect(Array.isArray(sections)).toBe(true);
      expect(sections.length).toBe(1);
    });
    
    it('should create a single section when no matching headers are found', () => {
      mockDocument.querySelectorAll.mockReturnValue([]);

      const html = `
        <html>
          <body>
            <p>No headers here</p>
            <div>Just content</div>
          </body>
        </html>
      `;
      
      const doc = parser.parseHTML(html);
      const sections = parser.extractSections(doc, SplitStrategy.H1);
      
      expect(sections).toBeDefined();
      expect(Array.isArray(sections)).toBe(true);
      expect(sections.length).toBe(1);
    });
    
    it('should handle empty body gracefully', () => {
      const html = '<html><body></body></html>';
      
      const doc = parser.parseHTML(html);
      const sections = parser.extractSections(doc, SplitStrategy.H1);
      
      expect(sections).toBeDefined();
      expect(Array.isArray(sections)).toBe(true);
    });
  });
  
  describe('extractImages', () => {
    it('should extract images from HTML document', () => {
      const mockImages = [
        { src: 'image1.jpg', alt: 'Image 1', getAttribute: vi.fn() },
        { src: 'image2.png', alt: 'Image 2', getAttribute: vi.fn() }
      ];
      
      mockImages[0].getAttribute.mockImplementation((attr: string) => {
        if (attr === 'src') return 'image1.jpg';
        if (attr === 'alt') return 'Image 1';
        return null;
      });
      
      mockImages[1].getAttribute.mockImplementation((attr: string) => {
        if (attr === 'src') return 'image2.png';
        if (attr === 'alt') return 'Image 2';
        return null;
      });

      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'img') return mockImages;
        return [];
      });

      const html = `
        <html>
          <body>
            <img src="image1.jpg" alt="Image 1">
            <img src="image2.png" alt="Image 2">
          </body>
        </html>
      `;
      
      const doc = parser.parseHTML(html);
      const images = parser.extractImages(doc);
      
      expect(images).toBeDefined();
      expect(Array.isArray(images)).toBe(true);
      expect(images.length).toBe(2);
    });
    
    it('should skip images without src attribute', () => {
      const mockImages = [
        { src: '', alt: 'No Source', getAttribute: vi.fn().mockReturnValue('') }
      ];

      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'img') return mockImages;
        return [];
      });

      const html = `
        <html>
          <body>
            <img alt="No Source">
          </body>
        </html>
      `;
      
      const doc = parser.parseHTML(html);
      const images = parser.extractImages(doc);
      
      expect(images).toBeDefined();
      expect(Array.isArray(images)).toBe(true);
    });
    
    it('should handle empty document gracefully', () => {
      mockDocument.querySelectorAll.mockReturnValue([]);

      const html = '<html><body></body></html>';
      
      const doc = parser.parseHTML(html);
      const images = parser.extractImages(doc);
      
      expect(images).toBeDefined();
      expect(Array.isArray(images)).toBe(true);
      expect(images.length).toBe(0);
    });
  });
  
  describe('extractTables', () => {
    it('should extract tables from HTML document', () => {
      const mockTables = [
        {
          querySelectorAll: vi.fn(),
          querySelector: vi.fn()
        }
      ];
      
      mockTables[0].querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'tr') {
          return [
            { querySelectorAll: vi.fn().mockReturnValue([{ textContent: 'Cell 1' }]) }
          ];
        }
        return [];
      });

      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'table') return mockTables;
        return [];
      });

      const html = `
        <html>
          <body>
            <table>
              <tr><td>Cell 1</td></tr>
            </table>
          </body>
        </html>
      `;
      
      const doc = parser.parseHTML(html);
      const tables = parser.extractTables(doc);
      
      expect(tables).toBeDefined();
      expect(Array.isArray(tables)).toBe(true);
    });
    
    it('should handle tables without thead', () => {
      const mockTables = [
        {
          querySelectorAll: vi.fn(),
          querySelector: vi.fn().mockReturnValue(null)
        }
      ];
      
      mockTables[0].querySelectorAll.mockReturnValue([]);

      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'table') return mockTables;
        return [];
      });

      const html = `
        <html>
          <body>
            <table>
              <tr><td>Cell 1</td></tr>
            </table>
          </body>
        </html>
      `;
      
      const doc = parser.parseHTML(html);
      const tables = parser.extractTables(doc);
      
      expect(tables).toBeDefined();
      expect(Array.isArray(tables)).toBe(true);
    });
    
    it('should handle empty document gracefully', () => {
      mockDocument.querySelectorAll.mockReturnValue([]);

      const html = '<html><body></body></html>';
      
      const doc = parser.parseHTML(html);
      const tables = parser.extractTables(doc);
      
      expect(tables).toBeDefined();
      expect(Array.isArray(tables)).toBe(true);
      expect(tables.length).toBe(0);
    });
  });
  
  describe('extractLists', () => {
    it('should extract unordered lists from HTML document', () => {
      const mockLists = [
        {
          tagName: 'UL',
          querySelectorAll: vi.fn().mockReturnValue([
            { textContent: 'Item 1' },
            { textContent: 'Item 2' }
          ])
        }
      ];

      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'ul, ol') return mockLists;
        return [];
      });

      const html = `
        <html>
          <body>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </body>
        </html>
      `;
      
      const doc = parser.parseHTML(html);
      const lists = parser.extractLists(doc);
      
      expect(lists).toBeDefined();
      expect(Array.isArray(lists)).toBe(true);
    });
    
    it('should extract ordered lists from HTML document', () => {
      const mockLists = [
        {
          tagName: 'OL',
          querySelectorAll: vi.fn().mockReturnValue([
            { textContent: 'First item' },
            { textContent: 'Second item' }
          ])
        }
      ];

      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'ul, ol') return mockLists;
        return [];
      });

      const html = `
        <html>
          <body>
            <ol>
              <li>First item</li>
              <li>Second item</li>
            </ol>
          </body>
        </html>
      `;
      
      const doc = parser.parseHTML(html);
      const lists = parser.extractLists(doc);
      
      expect(lists).toBeDefined();
      expect(Array.isArray(lists)).toBe(true);
    });
    
    it('should preserve formatting within list items', () => {
      const mockLists = [
        {
          tagName: 'UL',
          querySelectorAll: vi.fn().mockReturnValue([
            { innerHTML: '<strong>Bold</strong> item' },
            { innerHTML: '<em>Italic</em> item' }
          ])
        }
      ];

      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'ul, ol') return mockLists;
        return [];
      });

      const html = `
        <html>
          <body>
            <ul>
              <li><strong>Bold</strong> item</li>
              <li><em>Italic</em> item</li>
            </ul>
          </body>
        </html>
      `;
      
      const doc = parser.parseHTML(html);
      const lists = parser.extractLists(doc);
      
      expect(lists).toBeDefined();
      expect(Array.isArray(lists)).toBe(true);
    });
    
    it('should skip empty lists', () => {
      const mockLists = [
        {
          tagName: 'UL',
          querySelectorAll: vi.fn().mockReturnValue([])
        }
      ];

      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'ul, ol') return mockLists;
        return [];
      });

      const html = `
        <html>
          <body>
            <ul></ul>
          </body>
        </html>
      `;
      
      const doc = parser.parseHTML(html);
      const lists = parser.extractLists(doc);
      
      expect(lists).toBeDefined();
      expect(Array.isArray(lists)).toBe(true);
    });
    
    it('should handle empty document gracefully', () => {
      mockDocument.querySelectorAll.mockReturnValue([]);

      const html = '<html><body></body></html>';
      
      const doc = parser.parseHTML(html);
      const lists = parser.extractLists(doc);
      
      expect(lists).toBeDefined();
      expect(Array.isArray(lists)).toBe(true);
      expect(lists.length).toBe(0);
    });
  });
});