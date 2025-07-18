import { describe, it, expect, beforeEach } from 'vitest';
import { LinkHandler, LinkHandlingError } from '../../src/services/conversion/LinkHandler';
import { LinkResource } from '../../src/models';

describe('LinkHandler', () => {
  let linkHandler: LinkHandler;
  
  beforeEach(() => {
    linkHandler = new LinkHandler();
  });
  
  describe('processLink', () => {
    it('should process a link with text and href', () => {
      const linkResource: LinkResource = {
        text: 'Example Link',
        href: 'http://example.com'
      };
      
      const processedLink = linkHandler.processLink(linkResource);
      
      expect(processedLink).toBeDefined();
      expect(processedLink.text).toBe('Example Link');
      expect(processedLink.href).toBe('https://example.com'); // Normalized to https
    });
    
    it('should extract text from HTML content', () => {
      const linkResource: LinkResource = {
        text: '<strong>Bold Link</strong>',
        href: 'http://example.com'
      };
      
      const processedLink = linkHandler.processLink(linkResource);
      
      expect(processedLink.text).toBe('Bold Link');
    });
    
    it('should handle empty href', () => {
      const linkResource: LinkResource = {
        text: 'Empty Link',
        href: ''
      };
      
      const processedLink = linkHandler.processLink(linkResource);
      
      expect(processedLink.href).toBe('#');
    });
  });
  
  describe('normalizeUrl', () => {
    it('should convert http to https', () => {
      const url = 'http://example.com';
      const normalizedUrl = linkHandler.normalizeUrl(url);
      
      expect(normalizedUrl).toBe('https://example.com');
    });
    
    it('should add https to URLs without protocol', () => {
      const url = 'example.com';
      const normalizedUrl = linkHandler.normalizeUrl(url);
      
      expect(normalizedUrl).toBe('https://example.com');
    });
    
    it('should preserve anchor links', () => {
      const url = '#section1';
      const normalizedUrl = linkHandler.normalizeUrl(url);
      
      expect(normalizedUrl).toBe('#section1');
    });
    
    it('should preserve relative paths', () => {
      const url = '/path/to/page';
      const normalizedUrl = linkHandler.normalizeUrl(url);
      
      expect(normalizedUrl).toBe('/path/to/page');
    });
    
    it('should preserve other protocols', () => {
      const url = 'mailto:user@example.com';
      const normalizedUrl = linkHandler.normalizeUrl(url);
      
      expect(normalizedUrl).toBe('mailto:user@example.com');
    });
    
    it('should handle empty URLs', () => {
      const url = '';
      const normalizedUrl = linkHandler.normalizeUrl(url);
      
      expect(normalizedUrl).toBe('#');
    });
  });
  
  describe('extractLinkText', () => {
    it('should extract text from HTML content', () => {
      const html = '<strong>Bold</strong> and <em>italic</em> text';
      const text = linkHandler.extractLinkText(html);
      
      expect(text).toBe('Bold and italic text');
    });
    
    it('should handle plain text', () => {
      const text = 'Plain text';
      const extractedText = linkHandler.extractLinkText(text);
      
      expect(extractedText).toBe('Plain text');
    });
    
    it('should handle empty content', () => {
      const html = '';
      const text = linkHandler.extractLinkText(html);
      
      expect(text).toBe('');
    });
  });
  
  describe('applyLinkStyling', () => {
    it('should apply basic link styling', () => {
      const linkResource: LinkResource = {
        text: 'Example Link',
        href: 'https://example.com'
      };
      
      const styling = linkHandler.applyLinkStyling(linkResource);
      
      expect(styling.x).toBe(0.5);
      expect(styling.y).toBe(2);
      expect(styling.w).toBe('90%');
      expect(styling.fontSize).toBe(18);
      expect(styling.color).toBe('0000FF');
      expect(styling.underline).toBe(true);
      expect(styling.hyperlink).toEqual({ url: 'https://example.com' });
      expect(styling.tooltip).toBe('https://example.com');
    });
  });
  
  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(linkHandler.isValidUrl('https://example.com')).toBe(true);
      expect(linkHandler.isValidUrl('http://example.com')).toBe(true);
      expect(linkHandler.isValidUrl('mailto:user@example.com')).toBe(true);
    });
    
    it('should validate anchor links', () => {
      expect(linkHandler.isValidUrl('#section1')).toBe(true);
    });
    
    it('should validate relative paths', () => {
      expect(linkHandler.isValidUrl('/path/to/page')).toBe(true);
      expect(linkHandler.isValidUrl('path/to/page')).toBe(true);
    });
    
    it('should reject invalid URLs', () => {
      expect(linkHandler.isValidUrl('')).toBe(false);
    });
  });
  
  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(linkHandler.extractDomain('https://example.com/path')).toBe('example.com');
      expect(linkHandler.extractDomain('http://sub.example.com')).toBe('sub.example.com');
    });
    
    it('should handle invalid URLs', () => {
      expect(linkHandler.extractDomain('invalid-url')).toBe('');
    });
  });
});