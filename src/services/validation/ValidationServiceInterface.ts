import { ConversionConfig } from '../../models';

/**
 * Validation Service Interface
 * 
 * This interface defines the contract for validation services in the HTML to PPTX converter.
 * 
 * Requirements:
 * - 1.5: Display appropriate error messages for invalid HTML
 * - 5.4: Display clear error messages and guidance on how to resolve issues
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Array of error messages that prevent processing */
  errors: string[];
  /** Array of warning messages that don't prevent processing */
  warnings: string[];
  /** Array of suggestions for improvement */
  suggestions: string[];
}

/**
 * HTML validation options
 */
export interface HTMLValidationOptions {
  /** Maximum content size in bytes */
  maxSize?: number;
  /** Whether to require basic HTML document structure */
  requireBasicStructure?: boolean;
  /** Whether to allow HTML fragments without document structure */
  allowFragments?: boolean;
  /** Whether to check for potentially malicious content */
  checkForMaliciousContent?: boolean;
}

/**
 * Configuration validation options
 */
export interface ConfigValidationOptions {
  /** Whether all configuration fields are required */
  requireAllFields?: boolean;
  /** Whether to validate custom CSS selectors */
  validateCustomSelectors?: boolean;
}

/**
 * File validation options
 */
export interface FileValidationOptions {
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allowed file types */
  allowedTypes?: string[];
  /** Allowed file extensions */
  allowedExtensions?: string[];
}

/**
 * Validation service interface
 */
export interface ValidationServiceInterface {
  /**
   * Validate HTML content
   * 
   * @param htmlContent - HTML content to validate
   * @param options - Validation options
   * @returns Validation result
   */
  validateHTML(htmlContent: string, options?: HTMLValidationOptions): ValidationResult;

  /**
   * Validate conversion configuration
   * 
   * @param config - Configuration to validate
   * @param options - Validation options
   * @returns Validation result
   */
  validateConfiguration(config: ConversionConfig, options?: ConfigValidationOptions): ValidationResult;

  /**
   * Validate file upload
   * 
   * @param file - File to validate
   * @param maxSize - Maximum file size in bytes
   * @returns Validation result
   */
  validateFileUpload(file: File, maxSize?: number): ValidationResult;

  /**
   * Get user-friendly validation error message
   * 
   * @param result - Validation result
   * @returns Formatted error message
   */
  getValidationErrorMessage(result: ValidationResult): string;
}

/**
 * Validation error display options
 */
export interface ValidationErrorDisplayOptions {
  /** Whether to show warnings */
  showWarnings?: boolean;
  /** Whether to show suggestions */
  showSuggestions?: boolean;
  /** Maximum number of errors to display */
  maxErrors?: number;
  /** Whether to group similar errors */
  groupSimilar?: boolean;
}

/**
 * Validation context for error reporting
 */
export interface ValidationContext {
  /** The component or step where validation occurred */
  source: 'upload' | 'config' | 'preview' | 'conversion';
  /** Additional context information */
  metadata?: Record<string, any>;
  /** User action that triggered validation */
  action?: string;
}