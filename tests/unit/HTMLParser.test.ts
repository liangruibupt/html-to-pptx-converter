import { describe, it, expect } from 'vitest';
import { HTMLParser, HTMLParsingError } from '../../src/services/parser';

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
      expect(result.sections).toEqual([]);
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
  });
});