import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorHandler } from '../../../src/services/error/ErrorHandler.ts';
import { 
  ErrorSeverity, 
  ErrorCategory, 
  HTMLParsingError, 
  PptxGenerationError,
  SlideCreationError,
  ValidationError
} from '../../../src/services/error/ErrorHandlerInterface.ts';

describe('ErrorHandler', () => {
  let errorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  describe('handleError', () => {
    it('should handle a generic error', () => {
      const error = new Error('Test error message');
      const context = { jobId: 'test-job-123', step: 'parsing_html' };
      
      const result = errorHandler.handleError(error, context);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('code');
      expect(result.message).toBe('Test error message');
      expect(result.context.jobId).toBe('test-job-123');
      expect(result.context.step).toBe('parsing_html');
      expect(result.originalError).toBe(error);
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(typeof result.recoverable).toBe('boolean');
    });

    it('should handle HTML parsing errors', () => {
      const error = new HTMLParsingError('Invalid HTML structure');
      const context = { jobId: 'test-job-123' };
      
      const result = errorHandler.handleError(error, context);
      
      expect(result.category).toBe(ErrorCategory.PARSING);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
      expect(result.code).toBe('HTML_PARSING_ERROR');
      expect(result.recoverable).toBe(false);
    });

    it('should handle PPTX generation errors', () => {
      const error = new PptxGenerationError('Failed to generate PPTX');
      const context = { jobId: 'test-job-123' };
      
      const result = errorHandler.handleError(error, context);
      
      expect(result.category).toBe(ErrorCategory.GENERATION);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
      expect(result.code).toBe('PPTX_GENERATION_ERROR');
      expect(result.recoverable).toBe(false);
    });

    it('should handle slide creation errors', () => {
      const error = new SlideCreationError('Failed to create slides');
      const context = { jobId: 'test-job-123' };
      
      const result = errorHandler.handleError(error, context);
      
      expect(result.category).toBe(ErrorCategory.CONVERSION);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.code).toBe('SLIDE_CREATION_ERROR');
      expect(result.recoverable).toBe(true);
    });

    it('should handle validation errors', () => {
      const error = new ValidationError('Invalid input data');
      const context = { jobId: 'test-job-123' };
      
      const result = errorHandler.handleError(error, context);
      
      expect(result.category).toBe(ErrorCategory.VALIDATION);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.recoverable).toBe(true);
    });
  });

  describe('createUserFriendlyMessage', () => {
    it('should create user-friendly message for HTML parsing error', () => {
      const error = new HTMLParsingError('Unclosed tag detected');
      const context = {};
      
      const message = errorHandler.createUserFriendlyMessage(error, context);
      
      expect(message).toContain('couldn\'t parse your HTML content');
      expect(message).toContain('Unclosed tag detected');
      expect(message).toContain('well-formed');
    });

    it('should create user-friendly message for PPTX generation error', () => {
      const error = new PptxGenerationError('Library initialization failed');
      const context = {};
      
      const message = errorHandler.createUserFriendlyMessage(error, context);
      
      expect(message).toContain('generating your PowerPoint presentation');
      expect(message).toContain('Library initialization failed');
    });

    it('should create user-friendly message for generic error', () => {
      const error = new Error('Something went wrong');
      const context = {};
      
      const message = errorHandler.createUserFriendlyMessage(error, context);
      
      expect(message).toContain('unexpected error occurred');
      expect(message).toContain('Something went wrong');
    });
  });

  describe('isRecoverable', () => {
    it('should identify recoverable errors', () => {
      const recoverableError = new SlideCreationError('Temporary issue');
      const context = {};
      
      const result = errorHandler.isRecoverable(recoverableError, context);
      
      expect(result).toBe(true);
    });

    it('should identify non-recoverable errors', () => {
      const nonRecoverableError = new HTMLParsingError('Malformed HTML');
      const context = {};
      
      const result = errorHandler.isRecoverable(nonRecoverableError, context);
      
      expect(result).toBe(false);
    });

    it('should identify recoverable patterns in generic errors', () => {
      const networkError = new Error('Network timeout occurred');
      const context = {};
      
      const result = errorHandler.isRecoverable(networkError, context);
      
      expect(result).toBe(true);
    });
  });

  describe('getSuggestions', () => {
    it('should provide suggestions for HTML parsing errors', () => {
      const error = new HTMLParsingError('Invalid HTML structure');
      const context = {};
      const conversionError = errorHandler.handleError(error, context);
      
      const suggestions = errorHandler.getSuggestions(conversionError);
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('HTML'))).toBe(true);
      expect(suggestions.some(s => s.includes('well-formed'))).toBe(true);
    });

    it('should provide suggestions for PPTX generation errors', () => {
      const error = new PptxGenerationError('Generation failed');
      const context = {};
      const conversionError = errorHandler.handleError(error, context);
      
      const suggestions = errorHandler.getSuggestions(conversionError);
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('complexity'))).toBe(true);
    });
  });

  describe('getErrorStats', () => {
    it('should return error statistics', () => {
      // Generate some errors
      const error1 = new HTMLParsingError('Error 1');
      const error2 = new PptxGenerationError('Error 2');
      const error3 = new ValidationError('Error 3');
      
      errorHandler.handleError(error1, {});
      errorHandler.handleError(error2, {});
      errorHandler.handleError(error3, {});
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats.total).toBe(3);
      expect(stats.byCategory[ErrorCategory.PARSING]).toBe(1);
      expect(stats.byCategory[ErrorCategory.GENERATION]).toBe(1);
      expect(stats.byCategory[ErrorCategory.VALIDATION]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.HIGH]).toBe(2);
      expect(stats.bySeverity[ErrorSeverity.MEDIUM]).toBe(1);
      expect(Array.isArray(stats.recent)).toBe(true);
    });
  });

  describe('clearErrorHistory', () => {
    it('should clear error history', () => {
      // Generate an error
      const error = new Error('Test error');
      errorHandler.handleError(error, {});
      
      // Verify error exists
      let stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(1);
      
      // Clear history
      errorHandler.clearErrorHistory();
      
      // Verify history is cleared
      stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(0);
    });
  });
});