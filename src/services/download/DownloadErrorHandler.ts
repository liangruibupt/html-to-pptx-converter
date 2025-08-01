import { ErrorHandler } from '../error/ErrorHandler';
import { 
  ErrorSeverity, 
  ErrorCategory, 
  ErrorContext, 
  ConversionError 
} from '../error/ErrorHandlerInterface';
import { DownloadError } from './DownloadServiceInterface';

/**
 * Download Error Handler
 * 
 * This service provides specialized error handling for download operations
 * with retry logic and user-friendly error messages.
 * 
 * Requirements:
 * - 4.5: Create error detection for download failures and add retry functionality
 */

export interface DownloadErrorContext extends ErrorContext {
  /** Download attempt number */
  attemptNumber?: number;
  /** File size being downloaded */
  fileSize?: number;
  /** Filename being downloaded */
  filename?: string;
  /** Browser information */
  browserInfo?: string;
  /** Download method used */
  downloadMethod?: string;
}

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay between retries in milliseconds */
  baseDelay: number;
  /** Whether to use exponential backoff */
  exponentialBackoff: boolean;
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  /** Jitter factor for randomizing delays */
  jitterFactor: number;
}

export interface DownloadErrorHandlerOptions {
  /** Retry configuration */
  retryConfig?: Partial<RetryConfig>;
  /** Whether to automatically retry certain errors */
  autoRetry?: boolean;
  /** Custom error messages */
  customMessages?: Record<string, string>;
}

/**
 * Download Error Handler Implementation
 */
export class DownloadErrorHandler {
  private errorHandler: ErrorHandler;
  private retryConfig: RetryConfig;
  private autoRetry: boolean;
  private customMessages: Record<string, string>;
  private retryAttempts: Map<string, number> = new Map();

  constructor(options: DownloadErrorHandlerOptions = {}) {
    this.errorHandler = new ErrorHandler();
    
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      exponentialBackoff: true,
      maxDelay: 10000,
      jitterFactor: 0.1,
      ...options.retryConfig
    };
    
    this.autoRetry = options.autoRetry ?? true;
    
    this.customMessages = {
      'NOT_SUPPORTED': 'Downloads are not supported in your browser. Please try using a different browser.',
      'INVALID_FILE': 'The file cannot be downloaded because it is empty or corrupted.',
      'PREPARATION_FAILED': 'Failed to prepare the file for download. Please try again.',
      'TRIGGER_FAILED': 'Failed to start the download. Please check your browser settings.',
      'NETWORK_ERROR': 'Network error occurred during download. Please check your connection.',
      'QUOTA_EXCEEDED': 'Storage quota exceeded. Please free up some space and try again.',
      'SECURITY_ERROR': 'Security restrictions prevented the download. Please check your browser settings.',
      ...options.customMessages
    };
  }

  /**
   * Handle a download error with retry logic
   * 
   * @param error - The download error
   * @param context - Error context information
   * @returns Promise that resolves with retry information
   */
  async handleDownloadError(
    error: DownloadError, 
    context: DownloadErrorContext = {}
  ): Promise<{
    shouldRetry: boolean;
    retryDelay: number;
    retryAttempt: number;
    userMessage: string;
    conversionError: ConversionError;
  }> {
    // Create enhanced context
    const enhancedContext: DownloadErrorContext = {
      ...context,
      browserInfo: this.getBrowserInfo(),
      downloadMethod: 'blob_url',
      timestamp: new Date()
    };

    // Handle the error using the base error handler
    const conversionError = this.errorHandler.handleError(error, enhancedContext);

    // Determine if we should retry
    const downloadId = this.generateDownloadId(enhancedContext);
    const currentAttempts = this.retryAttempts.get(downloadId) || 0;
    const shouldRetry = this.shouldRetryError(error, currentAttempts);

    let retryDelay = 0;
    let retryAttempt = currentAttempts;

    if (shouldRetry) {
      retryAttempt = currentAttempts + 1;
      this.retryAttempts.set(downloadId, retryAttempt);
      retryDelay = this.calculateRetryDelay(retryAttempt);
    } else {
      // Clean up retry tracking if we're not retrying
      this.retryAttempts.delete(downloadId);
    }

    // Generate user-friendly message
    const userMessage = this.createUserFriendlyMessage(error, enhancedContext, retryAttempt);

    return {
      shouldRetry,
      retryDelay,
      retryAttempt,
      userMessage,
      conversionError
    };
  }

  /**
   * Determine if an error should be retried
   * 
   * @private
   * @param error - The download error
   * @param currentAttempts - Number of attempts already made
   * @returns True if the error should be retried
   */
  private shouldRetryError(error: DownloadError, currentAttempts: number): boolean {
    // Don't retry if auto-retry is disabled
    if (!this.autoRetry) {
      return false;
    }

    // Don't retry if we've exceeded max attempts
    if (currentAttempts >= this.retryConfig.maxRetries) {
      return false;
    }

    // Don't retry certain error types
    const nonRetryableErrors = [
      'NOT_SUPPORTED',
      'INVALID_FILE',
      'SECURITY_ERROR',
      'QUOTA_EXCEEDED'
    ];

    if (nonRetryableErrors.includes(error.code)) {
      return false;
    }

    // Retry network-related errors and temporary failures
    const retryableErrors = [
      'NETWORK_ERROR',
      'TRIGGER_FAILED',
      'PREPARATION_FAILED',
      'TIMEOUT'
    ];

    return retryableErrors.includes(error.code) || 
           error.message.toLowerCase().includes('network') ||
           error.message.toLowerCase().includes('timeout') ||
           error.message.toLowerCase().includes('temporary');
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   * 
   * @private
   * @param attemptNumber - Current attempt number
   * @returns Delay in milliseconds
   */
  private calculateRetryDelay(attemptNumber: number): number {
    let delay = this.retryConfig.baseDelay;

    if (this.retryConfig.exponentialBackoff) {
      delay = this.retryConfig.baseDelay * Math.pow(2, attemptNumber - 1);
    }

    // Apply maximum delay limit
    delay = Math.min(delay, this.retryConfig.maxDelay);

    // Add jitter to prevent thundering herd
    if (this.retryConfig.jitterFactor > 0) {
      const jitter = delay * this.retryConfig.jitterFactor * Math.random();
      delay += jitter;
    }

    return Math.round(delay);
  }

  /**
   * Create user-friendly error message
   * 
   * @private
   * @param error - The download error
   * @param context - Error context
   * @param retryAttempt - Current retry attempt
   * @returns User-friendly error message
   */
  private createUserFriendlyMessage(
    error: DownloadError, 
    context: DownloadErrorContext,
    retryAttempt: number
  ): string {
    // Use custom message if available
    if (this.customMessages[error.code]) {
      let message = this.customMessages[error.code];
      
      if (retryAttempt > 0) {
        message += ` (Attempt ${retryAttempt}/${this.retryConfig.maxRetries + 1})`;
      }
      
      return message;
    }

    // Generate contextual message
    let message = 'Download failed';
    
    if (context.filename) {
      message += ` for "${context.filename}"`;
    }
    
    message += `: ${error.message}`;

    // Add retry information
    if (retryAttempt > 0) {
      message += ` (Attempt ${retryAttempt}/${this.retryConfig.maxRetries + 1})`;
    }

    // Add suggestions based on error type
    const suggestions = this.getErrorSuggestions(error);
    if (suggestions.length > 0) {
      message += '\n\nSuggestions:\n' + suggestions.map(s => `• ${s}`).join('\n');
    }

    return message;
  }

  /**
   * Get suggestions for resolving download errors
   * 
   * @private
   * @param error - The download error
   * @returns Array of suggestions
   */
  private getErrorSuggestions(error: DownloadError): string[] {
    const suggestions: string[] = [];

    switch (error.code) {
      case 'NOT_SUPPORTED':
        suggestions.push(
          'Try using a modern browser like Chrome, Firefox, or Safari',
          'Enable JavaScript if it\'s disabled',
          'Check if your browser blocks downloads'
        );
        break;

      case 'INVALID_FILE':
        suggestions.push(
          'Try converting the HTML again',
          'Check if the original HTML content is valid',
          'Refresh the page and try again'
        );
        break;

      case 'TRIGGER_FAILED':
        suggestions.push(
          'Check your browser\'s download settings',
          'Disable popup blockers for this site',
          'Try right-clicking and selecting "Save as"'
        );
        break;

      case 'NETWORK_ERROR':
        suggestions.push(
          'Check your internet connection',
          'Try again in a few moments',
          'Disable VPN or proxy if you\'re using one'
        );
        break;

      case 'QUOTA_EXCEEDED':
        suggestions.push(
          'Free up storage space on your device',
          'Clear browser cache and temporary files',
          'Try downloading to a different location'
        );
        break;

      case 'SECURITY_ERROR':
        suggestions.push(
          'Check your browser security settings',
          'Allow downloads from this site',
          'Disable strict security extensions temporarily'
        );
        break;

      default:
        suggestions.push(
          'Refresh the page and try again',
          'Try using a different browser',
          'Contact support if the problem persists'
        );
    }

    return suggestions;
  }

  /**
   * Generate a unique download ID for retry tracking
   * 
   * @private
   * @param context - Error context
   * @returns Unique download ID
   */
  private generateDownloadId(context: DownloadErrorContext): string {
    const parts = [
      context.filename || 'unknown',
      context.fileSize || 0,
      context.jobId || 'no-job'
    ];
    
    return parts.join('-');
  }

  /**
   * Get browser information for error context
   * 
   * @private
   * @returns Browser information string
   */
  private getBrowserInfo(): string {
    if (typeof navigator === 'undefined') {
      return 'Unknown';
    }

    const userAgent = navigator.userAgent;
    
    // Simple browser detection
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Unknown';
  }

  /**
   * Clear retry tracking for a specific download
   * 
   * @param context - Error context to identify the download
   */
  clearRetryTracking(context: DownloadErrorContext): void {
    const downloadId = this.generateDownloadId(context);
    this.retryAttempts.delete(downloadId);
  }

  /**
   * Clear all retry tracking
   */
  clearAllRetryTracking(): void {
    this.retryAttempts.clear();
  }

  /**
   * Get retry statistics
   * 
   * @returns Retry statistics
   */
  getRetryStats(): {
    activeRetries: number;
    totalRetryAttempts: number;
    averageRetryAttempts: number;
  } {
    const attempts = Array.from(this.retryAttempts.values());
    const totalRetryAttempts = attempts.reduce((sum, count) => sum + count, 0);
    const averageRetryAttempts = attempts.length > 0 ? totalRetryAttempts / attempts.length : 0;

    return {
      activeRetries: this.retryAttempts.size,
      totalRetryAttempts,
      averageRetryAttempts
    };
  }

  /**
   * Update retry configuration
   * 
   * @param newConfig - New retry configuration
   */
  updateRetryConfig(newConfig: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...newConfig };
  }

  /**
   * Create a download error from a generic error
   * 
   * @param error - Generic error
   * @param context - Error context
   * @returns Download error
   */
  createDownloadError(error: Error, context: DownloadErrorContext = {}): DownloadError {
    let code = 'DOWNLOAD_ERROR';
    let message = error.message;

    // Detect specific error types
    if (error.name === 'QuotaExceededError' || message.includes('quota')) {
      code = 'QUOTA_EXCEEDED';
    } else if (error.name === 'SecurityError' || message.includes('security')) {
      code = 'SECURITY_ERROR';
    } else if (message.includes('network') || message.includes('fetch')) {
      code = 'NETWORK_ERROR';
    } else if (message.includes('timeout')) {
      code = 'TIMEOUT';
    }

    return new DownloadError(message, code, { originalError: error, context });
  }
}