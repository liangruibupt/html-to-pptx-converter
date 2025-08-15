import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../../../src/services/validation/ValidationService.ts';

describe('ValidationService', () => {
  let validationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateHTML', () => {
    it('should validate valid HTML content', () => {
      const htmlContent = '<html><body><h1>Test</h1><p>Content</p></body></html>';
      const result = validationService.validateHTML(htmlContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty HTML content', () => {
      const result = validationService.validateHTML('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('HTML content cannot be empty');
    });

    it('should reject null or undefined HTML content', () => {
      const result1 = validationService.validateHTML(null);
      const result2 = validationService.validateHTML(undefined);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result1.errors[0]).toContain('HTML content is required');
      expect(result2.errors[0]).toContain('HTML content is required');
    });

    it('should reject content without HTML tags', () => {
      const result = validationService.validateHTML('Just plain text without any tags');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content does not contain any HTML tags');
      expect(result.suggestions).toContain('Add HTML tags like <p>, <h1>, <div>, etc. to your content');
    });

    it('should reject content that exceeds maximum size', () => {
      const largeContent = '<p>' + 'x'.repeat(6 * 1024 * 1024) + '</p>'; // 6MB
      const result = validationService.validateHTML(largeContent, { maxSize: 5 * 1024 * 1024 });
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum allowed size');
    });

    it('should accept HTML fragments when allowFragments is true', () => {
      const htmlFragment = '<h1>Title</h1><p>Content</p>';
      const result = validationService.validateHTML(htmlFragment, { 
        requireBasicStructure: true,
        allowFragments: true 
      });
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('HTML content appears to be a fragment without proper document structure');
    });

    it('should detect script tags as security issue', () => {
      const htmlWithScript = '<html><body><script>alert("test")</script><p>Content</p></body></html>';
      const result = validationService.validateHTML(htmlWithScript, { checkForMaliciousContent: true });
      
      expect(result.warnings).toContain('Script tags detected - these will be removed during conversion');
    });

    it('should detect images without alt text', () => {
      const htmlWithImages = '<html><body><img src="test.jpg"><p>Content</p></body></html>';
      const result = validationService.validateHTML(htmlWithImages);
      
      expect(result.warnings).toContain('Images without alt text detected');
      expect(result.suggestions).toContain('Add alt attributes to images for better accessibility');
    });

    it('should suggest adding headings when none are found', () => {
      const htmlWithoutHeadings = '<html><body><p>Just paragraphs</p><p>No headings</p></body></html>';
      const result = validationService.validateHTML(htmlWithoutHeadings);
      
      expect(result.warnings).toContain('No heading tags found');
      expect(result.suggestions).toContain('Add heading tags (h1, h2, etc.) to create better slide structure');
    });
  });

  describe('validateConfiguration', () => {
    const validConfig = {
      slideLayout: 'WIDE',
      theme: 'DEFAULT',
      splitSections: 'BY_H1',
      includeImages: true,
      preserveLinks: true,
      customStyles: {},
      imageOptions: {}
    };

    it('should validate valid configuration', () => {
      const result = validationService.validateConfiguration(validConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null or undefined configuration', () => {
      const result1 = validationService.validateConfiguration(null);
      const result2 = validationService.validateConfiguration(undefined);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result1.errors[0]).toContain('Configuration is required');
      expect(result2.errors[0]).toContain('Configuration is required');
    });

    it('should reject invalid slide layout', () => {
      const invalidConfig = { ...validConfig, slideLayout: 'INVALID' };
      const result = validationService.validateConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid slide layout: INVALID');
      expect(result.suggestions[0]).toContain('Choose from: STANDARD, WIDE, CUSTOM');
    });

    it('should reject invalid theme', () => {
      const invalidConfig = { ...validConfig, theme: 'INVALID' };
      const result = validationService.validateConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid theme: INVALID');
      expect(result.suggestions[0]).toContain('Choose from: DEFAULT, PROFESSIONAL, CREATIVE, MINIMAL');
    });

    it('should reject invalid split strategy', () => {
      const invalidConfig = { ...validConfig, splitSections: 'INVALID' };
      const result = validationService.validateConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid split strategy: INVALID');
      expect(result.suggestions[0]).toContain('Choose from: BY_H1, BY_H2, BY_CUSTOM_SELECTOR, NO_SPLIT');
    });

    it('should require custom selector when using custom splitting', () => {
      const configWithCustomSplit = { 
        ...validConfig, 
        splitSections: 'BY_CUSTOM_SELECTOR',
        customSectionSelector: undefined
      };
      const result = validationService.validateConfiguration(configWithCustomSplit);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Custom selector is required when using custom splitting');
      expect(result.suggestions).toContain('Provide a CSS selector (e.g., ".slide", "#section", "div.content")');
    });

    it('should validate custom CSS selector', () => {
      const configWithValidSelector = { 
        ...validConfig, 
        splitSections: 'BY_CUSTOM_SELECTOR',
        customSectionSelector: '.slide'
      };
      const result = validationService.validateConfiguration(configWithValidSelector);
      
      expect(result.isValid).toBe(true);
    });

    it('should warn about non-boolean includeImages', () => {
      const configWithInvalidBoolean = { ...validConfig, includeImages: 'true' };
      const result = validationService.validateConfiguration(configWithInvalidBoolean);
      
      expect(result.warnings).toContain('includeImages should be a boolean value');
      expect(result.suggestions).toContain('Set includeImages to true or false');
    });

    it('should allow optional fields when requireAllFields is false', () => {
      const minimalConfig = { slideLayout: 'WIDE' };
      const result = validationService.validateConfiguration(minimalConfig, { requireAllFields: false });
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateFileUpload', () => {
    const createMockFile = (name, size, type) => ({
      name,
      size,
      type,
      lastModified: Date.now(),
      webkitRelativePath: ''
    });

    it('should validate valid HTML file', () => {
      const file = createMockFile('test.html', 1024, 'text/html');
      const result = validationService.validateFileUpload(file);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null or undefined file', () => {
      const result1 = validationService.validateFileUpload(null);
      const result2 = validationService.validateFileUpload(undefined);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result1.errors[0]).toContain('No file provided');
      expect(result2.errors[0]).toContain('No file provided');
    });

    it('should reject file that exceeds maximum size', () => {
      const largeFile = createMockFile('large.html', 10 * 1024 * 1024, 'text/html'); // 10MB
      const result = validationService.validateFileUpload(largeFile, 5 * 1024 * 1024); // 5MB limit
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum allowed size');
      expect(result.suggestions).toContain('Try reducing the file size or splitting the content into smaller files');
    });

    it('should reject non-HTML file types', () => {
      const textFile = createMockFile('test.txt', 1024, 'text/plain');
      const result = validationService.validateFileUpload(textFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File must be an HTML file (.html, .htm, or .xhtml)');
      expect(result.suggestions).toContain('Upload a file with .html or .htm extension');
    });

    it('should accept HTML file with .htm extension', () => {
      const htmFile = createMockFile('test.htm', 1024, 'text/html');
      const result = validationService.validateFileUpload(htmFile);
      
      expect(result.isValid).toBe(true);
    });

    it('should reject empty file', () => {
      const emptyFile = createMockFile('empty.html', 0, 'text/html');
      const result = validationService.validateFileUpload(emptyFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File is empty');
      expect(result.suggestions).toContain('Upload a file with HTML content');
    });

    it('should warn about large files', () => {
      const largeFile = createMockFile('large.html', 2 * 1024 * 1024, 'text/html'); // 2MB
      const result = validationService.validateFileUpload(largeFile);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings[0]).toContain('Large file size');
      expect(result.suggestions).toContain('Consider optimizing your HTML content for better performance');
    });

    it('should accept file based on extension when type is not set', () => {
      const fileWithoutType = createMockFile('test.html', 1024, '');
      const result = validationService.validateFileUpload(fileWithoutType);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('getValidationErrorMessage', () => {
    it('should return empty string for valid result', () => {
      const validResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };
      
      const message = validationService.getValidationErrorMessage(validResult);
      expect(message).toBe('');
    });

    it('should format errors, warnings, and suggestions', () => {
      const invalidResult = {
        isValid: false,
        errors: ['Error 1', 'Error 2'],
        warnings: ['Warning 1'],
        suggestions: ['Suggestion 1', 'Suggestion 2']
      };
      
      const message = validationService.getValidationErrorMessage(invalidResult);
      
      expect(message).toContain('Validation failed:');
      expect(message).toContain('Errors:');
      expect(message).toContain('• Error 1');
      expect(message).toContain('• Error 2');
      expect(message).toContain('Warnings:');
      expect(message).toContain('• Warning 1');
      expect(message).toContain('Suggestions:');
      expect(message).toContain('• Suggestion 1');
      expect(message).toContain('• Suggestion 2');
    });

    it('should handle result with only errors', () => {
      const errorOnlyResult = {
        isValid: false,
        errors: ['Single error'],
        warnings: [],
        suggestions: []
      };
      
      const message = validationService.getValidationErrorMessage(errorOnlyResult);
      
      expect(message).toContain('Validation failed:');
      expect(message).toContain('Errors:');
      expect(message).toContain('• Single error');
      expect(message).not.toContain('Warnings:');
      expect(message).not.toContain('Suggestions:');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle HTML validation with malformed content gracefully', () => {
      const malformedHTML = '<html><body><p>Unclosed paragraph<div>Nested incorrectly</p></div></body></html>';
      const result = validationService.validateHTML(malformedHTML);
      
      // Should still be valid but with warnings
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle configuration validation with partial config', () => {
      const partialConfig = { slideLayout: 'WIDE' };
      const result = validationService.validateConfiguration(partialConfig, { requireAllFields: false });
      
      expect(result.isValid).toBe(true);
    });

    it('should handle very large HTML content', () => {
      const veryLargeHTML = '<html><body>' + '<p>Content</p>'.repeat(100000) + '</body></html>';
      const result = validationService.validateHTML(veryLargeHTML);
      
      // Should handle large content without crashing
      expect(typeof result.isValid).toBe('boolean');
    });
  });
});