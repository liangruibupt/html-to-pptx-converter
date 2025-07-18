import { describe, it, expect } from 'vitest';
import { HTMLParser } from '../../src/services/parser';

describe('Link Extraction', () => {
  const parser = new HTMLParser();
  
  describe('extractLinks', () => {
    it('should extract hyperlinks from HTML document', () => {
      const html = `
        <html>
          <body>
            <p>This is a paragraph with a <a href="https://example.com">link</a>.</p>
            <div>Another <a href="https://test.com">test link</a> in a div.</div>
            <a href="https://standalone.com">Standalone link</a>
          </body>
        </html>
      `;
      
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(html, 'text/html');
      const links = parser.extractLinks(doc);
      
      expect(links).toHaveLength(3);
      
      // Check first link
      expect(links[0].text).toBe('link');
      expect(links[0].href).toBe('https://example.com');
      
      // Check second link
      expect(links[1].text).toBe('test link');
      expect(links[1].href).toBe('https://test.com');
      
      // Check third link
      expect(links[2].text).toBe('Standalone link');
      expect(links[2].href).toBe('https://standalone.com');
    });
    
    it('should skip links without href attribute', () => {
      const html = `
        <html>
          <body>
            <a>Missing href</a>
            <a href="">Empty href</a>
            <a href="https://valid.com">Valid link</a>
          </body>
        </html>
      `;
      
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(html, 'text/html');
      const links = parser.extractLinks(doc);
      
      expect(links).toHaveLength(1);
      expect(links[0].href).toBe('https://valid.com');
    });
    
    it('should skip links without text content', () => {
      const html = `
        <html>
          <body>
            <a href="https://empty.com"></a>
            <a href="https://whitespace.com">   </a>
            <a href="https://valid.com">Valid text</a>
          </body>
        </html>
      `;
      
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(html, 'text/html');
      const links = parser.extractLinks(doc);
      
      expect(links).toHaveLength(1);
      expect(links[0].text).toBe('Valid text');
    });
    
    it('should handle empty document gracefully', () => {
      const html = '<html><body></body></html>';
      
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(html, 'text/html');
      const links = parser.extractLinks(doc);
      
      expect(links).toHaveLength(0);
    });
  });
  
  describe('parseHTML with links', () => {
    it('should include links in the parsed HTML content', () => {
      const html = `
        <html>
          <body>
            <h1>Document Title</h1>
            <p>This is a paragraph with a <a href="https://example.com">link</a>.</p>
            <a href="https://standalone.com">Standalone link</a>
          </body>
        </html>
      `;
      
      const result = parser.parseHTML(html);
      
      // Check that link resources were extracted
      expect(result.resources.links.length).toBeGreaterThan(0);
      
      // Check that links are correctly extracted
      const exampleLink = result.resources.links.find(link => link.href === 'https://example.com');
      const standaloneLink = result.resources.links.find(link => link.href === 'https://standalone.com');
      
      expect(exampleLink).toBeDefined();
      expect(standaloneLink).toBeDefined();
      expect(exampleLink?.text).toBe('link');
      expect(standaloneLink?.text).toBe('Standalone link');
    });
  });
});