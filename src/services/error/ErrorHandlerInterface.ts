/**
 * Error Handler Interface
 * 
 * This interface defines the contract for error handling services in the HTML to PPTX converter.
 * 
 * Requirements:
 * - 3.7: Provide meaningful error messages for conversion errors
 * - 3.8: Handle conversion errors gracefully and continue the process when possible
 * - 5.4: Display clear error messages and guidance on how to resolve issues
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for better classification
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  PARSING = 'parsing',
  CONVERSION = 'conversion',
  GENERATION = 'generation',
  DOWNLOAD = 'download',
  SYSTEM = 'system'
}

/**
 * Error context information
 */
export interface ErrorContext {
  jobId?: string;
  step?: string;
  htmlContent?: string;
  options?: any;
  timestamp?: Date;
  userAgent?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Structured error information
 */
export interface ConversionError {
  id: string;
  code: string;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  originalError?: Error;
  suggestions?: string[];
  recoverable: boolean;
  timestamp: Date;
}

/**
 * Error handling service interface
 */
export interface ErrorHandlerService {
  /**
   * Handle an error that occurred during conversion
   * 
   * @param error - The original error
   * @param context - Context information about where the error occurred
   * @returns Structured error information
   */
  handleError(error: Error, context: ErrorContext): ConversionError;
  
  /**
   * Create a user-friendly error message
   * 
   * @param error - The conversion error
   * @returns User-friendly error message with suggestions
   */
  createUserFriendlyMessage(error: ConversionError): string;
  
  /**
   * Determine if an error is recoverable
   * 
   * @param error - The error to check
   * @param context - Context information
   * @returns True if the error is recoverable, false otherwise
   */
  isRecoverable(error: Error, context: ErrorContext): boolean;
  
  /**
   * Get suggestions for resolving an error
   * 
   * @param error - The conversion error
   * @returns Array of suggestions for resolving the error
   */
  getSuggestions(error: ConversionError): string[];
  
  /**
   * Log an error for debugging purposes
   * 
   * @param error - The conversion error to log
   */
  logError(error: ConversionError): void;
  
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
  };
  
  /**
   * Clear error history
   */
  clearErrorHistory(): void;
}

/**
 * Custom error class for conversion errors
 */
export class ConversionProcessError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly context: ErrorContext;
  public readonly recoverable: boolean;
  
  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.CONVERSION,
    context: ErrorContext = {},
    recoverable: boolean = false
  ) {
    super(message);
    this.name = 'ConversionProcessError';
    this.code = code;
    this.severity = severity;
    this.category = category;
    this.context = context;
    this.recoverable = recoverable;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConversionProcessError);
    }
  }
}

/**
 * Custom error class for HTML parsing errors
 */
export class HTMLParsingError extends ConversionProcessError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      message,
      'HTML_PARSING_ERROR',
      ErrorSeverity.HIGH,
      ErrorCategory.PARSING,
      context,
      false
    );
    this.name = 'HTMLParsingError';
  }
}

/**
 * Custom error class for PPTX generation errors
 */
export class PptxGenerationError extends ConversionProcessError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      message,
      'PPTX_GENERATION_ERROR',
      ErrorSeverity.HIGH,
      ErrorCategory.GENERATION,
      context,
      false
    );
    this.name = 'PptxGenerationError';
  }
}

/**
 * Custom error class for slide creation errors
 */
export class SlideCreationError extends ConversionProcessError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      message,
      'SLIDE_CREATION_ERROR',
      ErrorSeverity.MEDIUM,
      ErrorCategory.CONVERSION,
      context,
      true
    );
    this.name = 'SlideCreationError';
  }
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends ConversionProcessError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      message,
      'VALIDATION_ERROR',
      ErrorSeverity.MEDIUM,
      ErrorCategory.VALIDATION,
      context,
      true
    );
    this.name = 'ValidationError';
  }
}