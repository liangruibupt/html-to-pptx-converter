import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DownloadErrorHandler } from '../../../src/services/download/DownloadErrorHandler.ts';
import { DownloadError } from '../../../src/services/download/DownloadServiceInterface.ts';

// Mock the ErrorHandler
vi.mock('../../../src/services/error/ErrorHandler.ts', () => ({
  ErrorHandler: vi.fn().mockImplementation(() => ({
    handleError: vi.fn().mockReturnValue({
      id: 'error-123',
      code: 'DOWNLOAD_ERROR',
      message: 'Test error',
      userMessage: 'Test error occurred',
      severity: 'MEDIUM',
      category: 'DOWNLOAD',
      context: {},
      suggestions: [],
      recoverable: true,
      timestamp: new Date()
    })
  }))
}));

describe('DownloadErrorHandler', () => {
  let errorHandler;

  beforeEach(() => {
    errorHandler = new DownloadErrorHandler();
  });

  describe('handleDownloadError', () => {
    it('should handle a retryable error', async () => {
      const error = new DownloadError('Network timeout', 'NETWORK_ERROR');
      const context = {
        filename: 'test.pptx',
        fileSize: 1024,
        attemptNumber: 1
      };

      const result = await errorHandler.handleDownloadError(error, context);

      expect(result.shouldRetry).toBe(true);
      expect(result.retryDelay).toBeGreaterThan(0);
      expect(result.retryAttempt).toBe(1);
      expect(result.userMessage).toContain('Network error');
      expect(result.conversionError).toBeDefined();
    });

    it('should not retry non-retryable errors', async () => {
      const error = new DownloadError('Downloads not supported', 'NOT_SUPPORTED');
      const context = { filename: 'test.pptx' };

      const result = await errorHandler.handleDownloadError(error, context);

      expect(result.shouldRetry).toBe(false);
      expect(result.retryDelay).toBe(0);
      expect(result.userMessage).toContain('not supported');
    });

    it('should not retry after max attempts', async () => {
      const error = new DownloadError('Network timeout', 'NETWORK_ERROR');
      const context = { filename: 'test.pptx' };

      // Simulate multiple attempts
      await errorHandler.handleDownloadError(error, context);
      await errorHandler.handleDownloadError(error, context);
      await errorHandler.handleDownloadError(error, context);
      
      // Fourth attempt should not retry
      const result = await errorHandler.handleDownloadError(error, context);

      expect(result.shouldRetry).toBe(false);
    });

    it('should calculate exponential backoff delay', async () => {
      const error = new DownloadError('Temporary failure', 'TRIGGER_FAILED');
      const context = { filename: 'test.pptx' };

      const result1 = await errorHandler.handleDownloadError(error, context);
      const result2 = await errorHandler.handleDownloadError(error, context);

      expect(result2.retryDelay).toBeGreaterThan(result1.retryDelay);
    });

    it('should include retry attempt in user message', async () => {
      const error = new DownloadError('Temporary failure', 'TRIGGER_FAILED');
      const context = { filename: 'test.pptx' };

      const result = await errorHandler.handleDownloadError(error, context);

      expect(result.userMessage).toContain('Attempt 1/4');
    });
  });

  describe('createDownloadError', () => {
    it('should create download error from generic error', () => {
      const genericError = new Error('Something went wrong');
      const context = { filename: 'test.pptx' };

      const downloadError = errorHandler.createDownloadError(genericError, context);

      expect(downloadError).toBeInstanceOf(DownloadError);
      expect(downloadError.message).toBe('Something went wrong');
      expect(downloadError.code).toBe('DOWNLOAD_ERROR');
    });

    it('should detect quota exceeded errors', () => {
      const quotaError = new Error('QuotaExceededError: Storage quota exceeded');
      quotaError.name = 'QuotaExceededError';

      const downloadError = errorHandler.createDownloadError(quotaError);

      expect(downloadError.code).toBe('QUOTA_EXCEEDED');
    });

    it('should detect security errors', () => {
      const securityError = new Error('SecurityError: Access denied');
      securityError.name = 'SecurityError';

      const downloadError = errorHandler.createDownloadError(securityError);

      expect(downloadError.code).toBe('SECURITY_ERROR');
    });

    it('should detect network errors', () => {
      const networkError = new Error('Network request failed');

      const downloadError = errorHandler.createDownloadError(networkError);

      expect(downloadError.code).toBe('NETWORK_ERROR');
    });
  });

  describe('retry configuration', () => {
    it('should use custom retry configuration', () => {
      const customHandler = new DownloadErrorHandler({
        retryConfig: {
          maxRetries: 5,
          baseDelay: 2000,
          exponentialBackoff: false
        }
      });

      expect(customHandler.retryConfig.maxRetries).toBe(5);
      expect(customHandler.retryConfig.baseDelay).toBe(2000);
      expect(customHandler.retryConfig.exponentialBackoff).toBe(false);
    });

    it('should update retry configuration', () => {
      errorHandler.updateRetryConfig({ maxRetries: 10 });

      expect(errorHandler.retryConfig.maxRetries).toBe(10);
    });

    it('should disable auto-retry when configured', async () => {
      const noRetryHandler = new DownloadErrorHandler({ autoRetry: false });
      const error = new DownloadError('Network timeout', 'NETWORK_ERROR');

      const result = await noRetryHandler.handleDownloadError(error);

      expect(result.shouldRetry).toBe(false);
    });
  });

  describe('retry tracking', () => {
    it('should track retry attempts', async () => {
      const error = new DownloadError('Network timeout', 'NETWORK_ERROR');
      const context = { filename: 'test.pptx', fileSize: 1024 };

      await errorHandler.handleDownloadError(error, context);
      await errorHandler.handleDownloadError(error, context);

      const stats = errorHandler.getRetryStats();

      expect(stats.activeRetries).toBe(1);
      expect(stats.totalRetryAttempts).toBe(2);
    });

    it('should clear retry tracking for specific download', async () => {
      const error = new DownloadError('Network timeout', 'NETWORK_ERROR');
      const context = { filename: 'test.pptx', fileSize: 1024 };

      await errorHandler.handleDownloadError(error, context);
      errorHandler.clearRetryTracking(context);

      const stats = errorHandler.getRetryStats();

      expect(stats.activeRetries).toBe(0);
    });

    it('should clear all retry tracking', async () => {
      const error = new DownloadError('Network timeout', 'NETWORK_ERROR');
      
      await errorHandler.handleDownloadError(error, { filename: 'test1.pptx' });
      await errorHandler.handleDownloadError(error, { filename: 'test2.pptx' });

      errorHandler.clearAllRetryTracking();

      const stats = errorHandler.getRetryStats();

      expect(stats.activeRetries).toBe(0);
    });
  });

  describe('custom messages', () => {
    it('should use custom error messages', async () => {
      const customHandler = new DownloadErrorHandler({
        customMessages: {
          'NETWORK_ERROR': 'Custom network error message'
        }
      });

      const error = new DownloadError('Network timeout', 'NETWORK_ERROR');
      const result = await customHandler.handleDownloadError(error);

      expect(result.userMessage).toContain('Custom network error message');
    });
  });

  describe('error suggestions', () => {
    it('should provide suggestions for NOT_SUPPORTED errors', async () => {
      const error = new DownloadError('Downloads not supported', 'NOT_SUPPORTED');
      const result = await errorHandler.handleDownloadError(error);

      expect(result.userMessage).toContain('modern browser');
    });

    it('should provide suggestions for NETWORK_ERROR', async () => {
      const error = new DownloadError('Network failed', 'NETWORK_ERROR');
      const result = await errorHandler.handleDownloadError(error);

      expect(result.userMessage).toContain('internet connection');
    });

    it('should provide suggestions for QUOTA_EXCEEDED', async () => {
      const error = new DownloadError('Storage full', 'QUOTA_EXCEEDED');
      const result = await errorHandler.handleDownloadError(error);

      expect(result.userMessage).toContain('storage space');
    });
  });
});