import { v4 as uuidv4 } from 'uuid';
import {
  ErrorHandlerService,
  ConversionError,
  ErrorSeverity,
  ErrorCategory,
  ErrorContext,
  ConversionProcessError,
  HTMLParsingError,
  PptxGenerationError,
  SlideCreationError,
  ValidationError
} from './ErrorHandlerInterface';

/**
 * Error Handler Service Implementation
 * 
 * This service provides comprehensive error handling for the HTML to PPTX conversion process.
 * 
 * Requirements:
 * - 3.7: Provide meaningful error messages for conversion errors
 * - 3.8: Handle conversion errors gracefully and continue the process when possible
 * - 5.4: Display clear error messages and guidance on how to resolve issues
 */
export class ErrorHandler implements ErrorHandlerService {
  private errorHistory: ConversionError[] = [];
  private maxHistorySize: number = 100;
  
  /**
   * Handle an error that occurred during conversion
   * 
   * @param error - The original error
   * @param context - Context information about where the error occurred
   * @returns Structured error information
   */
  handleError(error: Error, context: ErrorContext): ConversionError {
    // Create structured error information
    const conversionError: ConversionError = {
      id: uuidv4(),
      code: this.getErrorCode(error),
      message: error.message,
      userMessage: this.createUserFriendlyMessage(error, context),
      severity: this.getErrorSeverity(error),
      category: this.getErrorCategory(error),
      context: {
        ...context,
        timestamp: new Date(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
      },
      originalError: error,
      suggestions: this.getSuggestionsForError(error, context),
      recoverable: this.isRecoverable(error, context),
      timestamp: new Date()
    };
    
    // Add to error history
    this.addToHistory(conversionError);
    
    // Log the error
    this.logError(conversionError);
    
    return conversionError;
  }
  
  /**
   * Create a user-friendly error message
   * 
   * @param error - The conversion error or original error
   * @param context - Context information (optional, used when error is not ConversionError)
   * @returns User-friendly error message with suggestions
   */
  createUserFriendlyMessage(error: ConversionError | Error, context?: ErrorContext): string {
    if (error instanceof ConversionError) {
      return this.formatUserMessage(error);
    }
    
    // Handle different error types
    if (error instanceof HTMLParsingError) {
      return this.getHTMLParsingUserMessage(error, context);
    }
    
    if (error instanceof PptxGenerationError) {
      return this.getPptxGenerationUserMessage(error, context);
    }
    
    if (error instanceof SlideCreationError) {
      return this.getSlideCreationUserMessage(error, context);
    }
    
    if (error instanceof ValidationError) {
      return this.getValidationUserMessage(error, context);
    }
    
    // Generic error handling
    return this.getGenericUserMessage(error, context);
  }
  
  /**
   * Determine if an error is recoverable
   * 
   * @param error - The error to check
   * @param context - Context information
   * @returns True if the error is recoverable, false otherwise
   */
  isRecoverable(error: Error, context: ErrorContext): boolean {
    // Check if it's a custom error with recoverable flag
    if (error instanceof ConversionProcessError) {
      return error.recoverable;
    }
    
    // Check error patterns that are typically recoverable
    const recoverablePatterns = [
      /network/i,
      /timeout/i,
      /temporary/i,
      /retry/i,
      /connection/i
    ];
    
    const isRecoverablePattern = recoverablePatterns.some(pattern => 
      pattern.test(error.message)
    );
    
    // Check error types that are typically recoverable
    const recoverableTypes = [
      'ValidationError',
      'SlideCreationError'
    ];
    
    const isRecoverableType = recoverableTypes.includes(error.constructor.name);
    
    return isRecoverablePattern || isRecoverableType;
  }
  
  /**
   * Get suggestions for resolving an error
   * 
   * @param error - The conversion error
   * @returns Array of suggestions for resolving the error
   */
  getSuggestions(error: ConversionError): string[] {
    return error.suggestions || this.getSuggestionsForError(error.originalError || new Error(error.message), error.context);
  }
  
  /**
   * Log an error for debugging purposes
   * 
   * @param error - The conversion error to log
   */
  logError(error: ConversionError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = this.formatLogMessage(error);
    
    // Log to console based on severity
    switch (logLevel) {
      case 'error':
        console.error(logMessage, error.originalError);
        break;
      case 'warn':
        console.warn(logMessage, error.originalError);
        break;
      case 'info':
        console.info(logMessage);
        break;
      default:
        console.log(logMessage);
    }
    
    // In a production environment, you might want to send errors to a logging service
    // this.sendToLoggingService(error);
  }
  
  /**
   * Get error statistics
   * 
   * @returns Error statistics object
   */
  getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: ConversionError[];
  } {
    const stats = {
      total: this.errorHistory.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recent: this.errorHistory.slice(-10) // Last 10 errors
    };
    
    // Initialize counters
    Object.values(ErrorCategory).forEach(category => {
      stats.byCategory[category] = 0;
    });
    
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });
    
    // Count errors by category and severity
    this.errorHistory.forEach(error => {
      stats.byCategory[error.category]++;
      stats.bySeverity[error.severity]++;
    });
    
    return stats;
  }
  
  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }
  
  /**
   * Get error code from error
   * 
   * @private
   * @param error - The error
   * @returns Error code
   */
  private getErrorCode(error: Error): string {
    if (error instanceof ConversionProcessError) {
      return error.code;
    }
    
    // Generate code based on error type and message
    const errorType = error.constructor.name.toUpperCase();
    const messageHash = this.hashString(error.message).toString(36).toUpperCase();
    
    return `${errorType}_${messageHash}`;
  }
  
  /**
   * Get error severity from error
   * 
   * @private
   * @param error - The error
   * @returns Error severity
   */
  private getErrorSeverity(error: Error): ErrorSeverity {
    if (error instanceof ConversionProcessError) {
      return error.severity;
    }
    
    // Determine severity based on error type and message
    const criticalPatterns = [/fatal/i, /critical/i, /system/i];
    const highPatterns = [/parsing/i, /generation/i, /invalid/i];
    const lowPatterns = [/warning/i, /info/i, /notice/i];
    
    if (criticalPatterns.some(pattern => pattern.test(error.message))) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (highPatterns.some(pattern => pattern.test(error.message))) {
      return ErrorSeverity.HIGH;
    }
    
    if (lowPatterns.some(pattern => pattern.test(error.message))) {
      return ErrorSeverity.LOW;
    }
    
    return ErrorSeverity.MEDIUM;
  }
  
  /**
   * Get error category from error
   * 
   * @private
   * @param error - The error
   * @returns Error category
   */
  private getErrorCategory(error: Error): ErrorCategory {
    if (error instanceof ConversionProcessError) {
      return error.category;
    }
    
    // Determine category based on error type and message
    if (error instanceof HTMLParsingError || /parsing/i.test(error.message)) {
      return ErrorCategory.PARSING;
    }
    
    if (error instanceof PptxGenerationError || /generation/i.test(error.message)) {
      return ErrorCategory.GENERATION;
    }
    
    if (error instanceof ValidationError || /validation/i.test(error.message)) {
      return ErrorCategory.VALIDATION;
    }
    
    if (/download/i.test(error.message)) {
      return ErrorCategory.DOWNLOAD;
    }
    
    if (/system/i.test(error.message) || /network/i.test(error.message)) {
      return ErrorCategory.SYSTEM;
    }
    
    return ErrorCategory.CONVERSION;
  }
  
  /**
   * Get suggestions for an error
   * 
   * @private
   * @param error - The error
   * @param context - Context information
   * @returns Array of suggestions
   */
  private getSuggestionsForError(error: Error, context: ErrorContext): string[] {
    const suggestions: string[] = [];
    
    // HTML parsing error suggestions
    if (error instanceof HTMLParsingError || /parsing/i.test(error.message)) {
      suggestions.push(
        'Check that your HTML is well-formed and valid',
        'Try using a simpler HTML structure',
        'Validate your HTML using an online HTML validator',
        'Remove any malformed or unclosed tags'
      );
    }
    
    // PPTX generation error suggestions
    if (error instanceof PptxGenerationError || /generation/i.test(error.message)) {
      suggestions.push(
        'Try reducing the complexity of your HTML content',
        'Check if there are any unsupported HTML elements',
        'Try a different theme or layout option',
        'Reduce the number of images or tables in your content'
      );
    }
    
    // Validation error suggestions
    if (error instanceof ValidationError || /validation/i.test(error.message)) {
      suggestions.push(
        'Check that all required fields are filled',
        'Verify that your HTML content is not empty',
        'Ensure file size is within acceptable limits',
        'Try uploading a different HTML file'
      );
    }
    
    // Network/system error suggestions
    if (/network/i.test(error.message) || /system/i.test(error.message)) {
      suggestions.push(
        'Check your internet connection',
        'Try refreshing the page and attempting again',
        'Wait a moment and retry the operation',
        'Contact support if the problem persists'
      );
    }
    
    // Generic suggestions if no specific ones found
    if (suggestions.length === 0) {
      suggestions.push(
        'Try refreshing the page and attempting the conversion again',
        'Check that your HTML content is valid and well-formed',
        'Try using simpler HTML content to isolate the issue',
        'Contact support if the problem continues'
      );
    }
    
    return suggestions;
  }
  
  /**
   * Get user message for HTML parsing errors
   * 
   * @private
   * @param error - The HTML parsing error
   * @param context - Context information
   * @returns User-friendly message
   */
  private getHTMLParsingUserMessage(error: HTMLParsingError, context?: ErrorContext): string {
    return `We couldn't parse your HTML content. ${error.message}. Please check that your HTML is well-formed and try again.`;
  }
  
  /**
   * Get user message for PPTX generation errors
   * 
   * @private
   * @param error - The PPTX generation error
   * @param context - Context information
   * @returns User-friendly message
   */
  private getPptxGenerationUserMessage(error: PptxGenerationError, context?: ErrorContext): string {
    return `We encountered an issue while generating your PowerPoint presentation. ${error.message}. Please try simplifying your content or using different settings.`;
  }
  
  /**
   * Get user message for slide creation errors
   * 
   * @private
   * @param error - The slide creation error
   * @param context - Context information
   * @returns User-friendly message
   */
  private getSlideCreationUserMessage(error: SlideCreationError, context?: ErrorContext): string {
    return `There was a problem creating slides from your content. ${error.message}. You can try adjusting your conversion settings or simplifying your HTML.`;
  }
  
  /**
   * Get user message for validation errors
   * 
   * @private
   * @param error - The validation error
   * @param context - Context information
   * @returns User-friendly message
   */
  private getValidationUserMessage(error: ValidationError, context?: ErrorContext): string {
    return `Please check your input: ${error.message}. Make sure all required information is provided and try again.`;
  }
  
  /**
   * Get user message for generic errors
   * 
   * @private
   * @param error - The generic error
   * @param context - Context information
   * @returns User-friendly message
   */
  private getGenericUserMessage(error: Error, context?: ErrorContext): string {
    return `An unexpected error occurred during conversion: ${error.message}. Please try again or contact support if the problem persists.`;
  }
  
  /**
   * Format user message for ConversionError
   * 
   * @private
   * @param error - The conversion error
   * @returns Formatted user message
   */
  private formatUserMessage(error: ConversionError): string {
    let message = error.userMessage;
    
    if (error.suggestions && error.suggestions.length > 0) {
      message += '\n\nSuggestions:\n';
      message += error.suggestions.map(suggestion => `• ${suggestion}`).join('\n');
    }
    
    return message;
  }
  
  /**
   * Get log level for error severity
   * 
   * @private
   * @param severity - Error severity
   * @returns Log level
   */
  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'log';
    }
  }
  
  /**
   * Format log message
   * 
   * @private
   * @param error - The conversion error
   * @returns Formatted log message
   */
  private formatLogMessage(error: ConversionError): string {
    return `[${error.severity.toUpperCase()}] ${error.category.toUpperCase()}: ${error.code} - ${error.message}`;
  }
  
  /**
   * Add error to history
   * 
   * @private
   * @param error - The conversion error
   */
  private addToHistory(error: ConversionError): void {
    this.errorHistory.push(error);
    
    // Maintain maximum history size
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }
  
  /**
   * Simple hash function for strings
   * 
   * @private
   * @param str - String to hash
   * @returns Hash value
   */
  private hashString(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }
}