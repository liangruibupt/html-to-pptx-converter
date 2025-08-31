import { ValidationError, ErrorHandler } from '../error';
import { ConversionConfig } from '../../models';

/**
 * Validation Service
 * 
 * This service provides comprehensive validation for all user inputs and configurations.
 * It integrates with the error handling system to provide user-friendly error messages.
 * 
 * Requirements:
 * - 1.5: Display appropriate error messages for invalid HTML
 * - 5.4: Display clear error messages and guidance on how to resolve issues
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * HTML validation options
 */
export interface HTMLValidationOptions {
  maxSize?: number;
  requireBasicStructure?: boolean;
  allowFragments?: boolean;
  checkForMaliciousContent?: boolean;
}

/**
 * Configuration validation options
 */
export interface ConfigValidationOptions {
  requireAllFields?: boolean;
  validateCustomSelectors?: boolean;
}

/**
 * Validation Service Implementation
 */
export class ValidationService {
  private errorHandler: ErrorHandler;
  
  // Default validation options
  private defaultHTMLOptions: HTMLValidationOptions = {
    maxSize: 5 * 1024 * 1024, // 5MB
    requireBasicStructure: false,
    allowFragments: true,
    checkForMaliciousContent: true
  };

  private defaultConfigOptions: ConfigValidationOptions = {
    requireAllFields: true,
    validateCustomSelectors: true
  };

  constructor() {
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Validate HTML content
   * 
   * @param htmlContent - HTML content to validate
   * @param options - Validation options
   * @returns Validation result
   */
  validateHTML(htmlContent: string, options: HTMLValidationOptions = {}): ValidationResult {
    const opts = { ...this.defaultHTMLOptions, ...options };
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Basic content checks
      if (htmlContent === null || htmlContent === undefined || typeof htmlContent !== 'string') {
        result.errors.push('HTML content is required and must be a string');
        result.isValid = false;
        return result;
      }

      const trimmedContent = htmlContent.trim();
      if (!trimmedContent) {
        result.errors.push('HTML content cannot be empty');
        result.suggestions.push('Add HTML content with tags like <p>, <h1>, <div>, etc.');
        result.isValid = false;
        return result;
      }

      // Size validation
      const contentSize = new Blob([htmlContent]).size;
      if (opts.maxSize && contentSize > opts.maxSize) {
        result.errors.push(`Content size (${this.formatBytes(contentSize)}) exceeds maximum allowed size (${this.formatBytes(opts.maxSize)})`);
        result.isValid = false;
      }

      // HTML structure validation
      const hasHtmlTags = /<[a-z][\s\S]*>/i.test(trimmedContent);
      if (!hasHtmlTags) {
        result.errors.push('Content does not contain any HTML tags');
        result.suggestions.push('Add HTML tags like <p>, <h1>, <div>, etc. to your content');
        result.isValid = false;
      }

      // Basic HTML structure check
      if (opts.requireBasicStructure) {
        const hasHtmlElement = /<html[\s\S]*>[\s\S]*<\/html>/i.test(trimmedContent);
        const hasBodyElement = /<body[\s\S]*>[\s\S]*<\/body>/i.test(trimmedContent);
        
        if (!hasHtmlElement && !hasBodyElement) {
          if (!opts.allowFragments) {
            result.errors.push('HTML content must include <html> or <body> elements');
            result.suggestions.push('Wrap your content in <html><body>...</body></html> tags');
            result.isValid = false;
          } else {
            result.warnings.push('HTML content appears to be a fragment without proper document structure');
            result.suggestions.push('Consider wrapping your content in proper HTML document structure for better results');
          }
        }
      }

      // Check for malformed HTML
      const malformedChecks = this.checkForMalformedHTML(trimmedContent);
      if (malformedChecks.length > 0) {
        result.warnings.push(...malformedChecks);
        result.suggestions.push('Use an HTML validator to check for syntax errors');
      }

      // Check for potentially problematic content
      if (opts.checkForMaliciousContent) {
        const securityChecks = this.checkForSecurityIssues(trimmedContent);
        if (securityChecks.length > 0) {
          result.warnings.push(...securityChecks);
          result.suggestions.push('Remove script tags and potentially unsafe content');
        }
      }

      // Content quality checks
      const qualityChecks = this.checkContentQuality(trimmedContent);
      if (qualityChecks.warnings.length > 0) {
        result.warnings.push(...qualityChecks.warnings);
      }
      if (qualityChecks.suggestions.length > 0) {
        result.suggestions.push(...qualityChecks.suggestions);
      }

    } catch (error) {
      const validationError = new ValidationError(
        `HTML validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { htmlContent: htmlContent.substring(0, 100) + '...' }
      );
      
      const handledError = this.errorHandler.handleError(validationError, {
        step: 'html_validation',
        htmlContent: htmlContent.substring(0, 100) + '...'
      });

      result.errors.push(handledError.userMessage);
      result.suggestions.push(...handledError.suggestions || []);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate conversion configuration
   * 
   * @param config - Configuration to validate
   * @param options - Validation options
   * @returns Validation result
   */
  validateConfiguration(config: ConversionConfig, options: ConfigValidationOptions = {}): ValidationResult {
    const opts = { ...this.defaultConfigOptions, ...options };
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      if (!config || typeof config !== 'object') {
        result.errors.push('Configuration is required and must be an object');
        result.isValid = false;
        return result;
      }

      // Validate slide layout
      if (opts.requireAllFields && !config.slideLayout) {
        result.errors.push('Slide layout is required');
        result.suggestions.push('Select a slide layout (STANDARD, WIDE, or CUSTOM)');
        result.isValid = false;
      } else if (config.slideLayout) {
        const validLayouts = ['STANDARD', 'WIDE', 'CUSTOM'];
        if (!validLayouts.includes(config.slideLayout)) {
          result.errors.push(`Invalid slide layout: ${config.slideLayout}`);
          result.suggestions.push(`Choose from: ${validLayouts.join(', ')}`);
          result.isValid = false;
        }
      }

      // Validate theme
      if (opts.requireAllFields && !config.theme) {
        result.errors.push('Theme is required');
        result.suggestions.push('Select a theme (DEFAULT, PROFESSIONAL, CREATIVE, or MINIMAL)');
        result.isValid = false;
      } else if (config.theme) {
        const validThemes = ['DEFAULT', 'PROFESSIONAL', 'CREATIVE', 'MINIMAL'];
        if (!validThemes.includes(config.theme)) {
          result.errors.push(`Invalid theme: ${config.theme}`);
          result.suggestions.push(`Choose from: ${validThemes.join(', ')}`);
          result.isValid = false;
        }
      }

      // Validate split sections strategy
      if (opts.requireAllFields && !config.splitSections) {
        result.errors.push('Section splitting strategy is required');
        result.suggestions.push('Choose how to split your HTML into slides');
        result.isValid = false;
      } else if (config.splitSections) {
        const validStrategies = ['BY_H1', 'BY_H2', 'BY_CUSTOM_SELECTOR', 'NO_SPLIT'];
        if (!validStrategies.includes(config.splitSections)) {
          result.errors.push(`Invalid split strategy: ${config.splitSections}`);
          result.suggestions.push(`Choose from: ${validStrategies.join(', ')}`);
          result.isValid = false;
        }

        // Validate custom selector if using custom splitting
        if (config.splitSections === 'BY_CUSTOM_SELECTOR') {
          if (!config.customSectionSelector) {
            result.errors.push('Custom selector is required when using custom splitting');
            result.suggestions.push('Provide a CSS selector (e.g., ".slide", "#section", "div.content")');
            result.isValid = false;
          } else if (opts.validateCustomSelectors) {
            const selectorValidation = this.validateCSSSelector(config.customSectionSelector);
            if (!selectorValidation.isValid) {
              result.errors.push(`Invalid CSS selector: ${config.customSectionSelector}`);
              result.suggestions.push('Use a valid CSS selector syntax');
              result.isValid = false;
            }
          }
        }
      }

      // Validate boolean options
      if (typeof config.includeImages !== 'boolean') {
        result.warnings.push('includeImages should be a boolean value');
        result.suggestions.push('Set includeImages to true or false');
      }

      if (typeof config.preserveLinks !== 'boolean') {
        result.warnings.push('preserveLinks should be a boolean value');
        result.suggestions.push('Set preserveLinks to true or false');
      }

      // Validate custom styles if provided
      if (config.customStyles && typeof config.customStyles !== 'object') {
        result.warnings.push('customStyles should be an object');
        result.suggestions.push('Provide custom styles as a key-value object');
      }

      // Validate image options if provided
      if (config.imageOptions && typeof config.imageOptions !== 'object') {
        result.warnings.push('imageOptions should be an object');
        result.suggestions.push('Provide image options as a configuration object');
      }

    } catch (error) {
      const validationError = new ValidationError(
        `Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { additionalInfo: { config: JSON.stringify(config).substring(0, 100) + '...' } }
      );
      
      const handledError = this.errorHandler.handleError(validationError, {
        step: 'config_validation',
        options: config
      });

      result.errors.push(handledError.userMessage);
      result.suggestions.push(...handledError.suggestions || []);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate file upload
   * 
   * @param file - File to validate
   * @param maxSize - Maximum file size in bytes
   * @returns Validation result
   */
  validateFileUpload(file: File, maxSize: number = 5 * 1024 * 1024): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      if (!file) {
        result.errors.push('No file provided');
        result.isValid = false;
        return result;
      }

      // Check file size
      if (file.size > maxSize) {
        result.errors.push(`File size (${this.formatBytes(file.size)}) exceeds maximum allowed size (${this.formatBytes(maxSize)})`);
        result.suggestions.push('Try reducing the file size or splitting the content into smaller files');
        result.isValid = false;
      }

      // Check file type
      const validTypes = ['text/html', 'application/xhtml+xml'];
      const validExtensions = ['.html', '.htm', '.xhtml'];
      
      const hasValidType = validTypes.includes(file.type);
      const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

      if (!hasValidType && !hasValidExtension) {
        result.errors.push('File must be an HTML file (.html, .htm, or .xhtml)');
        result.suggestions.push('Upload a file with .html or .htm extension');
        result.isValid = false;
      }

      // Check for empty file
      if (file.size === 0) {
        result.errors.push('File is empty');
        result.suggestions.push('Upload a file with HTML content');
        result.isValid = false;
      }

      // Warn about very large files
      if (file.size > 1024 * 1024) { // 1MB
        result.warnings.push(`Large file size (${this.formatBytes(file.size)}) may take longer to process`);
        result.suggestions.push('Consider optimizing your HTML content for better performance');
      }

    } catch (error) {
      const validationError = new ValidationError(
        `File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { additionalInfo: { fileName: file?.name, fileSize: file?.size } }
      );
      
      const handledError = this.errorHandler.handleError(validationError, {
        step: 'file_validation',
        additionalInfo: { fileName: file?.name }
      });

      result.errors.push(handledError.userMessage);
      result.suggestions.push(...handledError.suggestions || []);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Get user-friendly validation error message
   * 
   * @param result - Validation result
   * @returns Formatted error message
   */
  getValidationErrorMessage(result: ValidationResult): string {
    if (result.isValid) {
      return '';
    }

    let message = 'Validation failed:\n';
    
    if (result.errors.length > 0) {
      message += '\nErrors:\n';
      message += result.errors.map(error => `• ${error}`).join('\n');
    }

    if (result.warnings.length > 0) {
      message += '\nWarnings:\n';
      message += result.warnings.map(warning => `• ${warning}`).join('\n');
    }

    if (result.suggestions.length > 0) {
      message += '\nSuggestions:\n';
      message += result.suggestions.map(suggestion => `• ${suggestion}`).join('\n');
    }

    return message;
  }

  /**
   * Check for malformed HTML
   * 
   * @private
   * @param html - HTML content to check
   * @returns Array of warning messages
   */
  private checkForMalformedHTML(html: string): string[] {
    const warnings: string[] = [];

    // Check for unclosed tags (basic check)
    const openTags = html.match(/<[a-z][^>]*>/gi) || [];
    const closeTags = html.match(/<\/[a-z][^>]*>/gi) || [];
    
    if (openTags.length > closeTags.length + 10) { // Allow some self-closing tags
      warnings.push('Possible unclosed HTML tags detected');
    }

    // Check for malformed attributes
    if (/<[^>]*=[^"'\s>][^>\s]*[^"'\s>]/i.test(html)) {
      warnings.push('Possible unquoted attribute values detected');
    }

    // Check for script tags without proper closing
    if (/<script[^>]*>(?![\s\S]*<\/script>)/i.test(html)) {
      warnings.push('Script tags without proper closing detected');
    }

    return warnings;
  }

  /**
   * Check for security issues
   * 
   * @private
   * @param html - HTML content to check
   * @returns Array of warning messages
   */
  private checkForSecurityIssues(html: string): string[] {
    const warnings: string[] = [];

    // Check for script tags
    if (/<script[\s\S]*?>/i.test(html)) {
      warnings.push('Script tags detected - these will be removed during conversion');
    }

    // Check for event handlers
    if (/on\w+\s*=/i.test(html)) {
      warnings.push('Event handlers detected - these will be removed during conversion');
    }

    // Check for iframe tags
    if (/<iframe[\s\S]*?>/i.test(html)) {
      warnings.push('Iframe tags detected - these may not convert properly');
    }

    return warnings;
  }

  /**
   * Check content quality
   * 
   * @private
   * @param html - HTML content to check
   * @returns Object with warnings and suggestions
   */
  private checkContentQuality(html: string): { warnings: string[]; suggestions: string[] } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Limit content length for performance
    const maxCheckLength = 100000; // 100KB
    const contentToCheck = html.length > maxCheckLength ? html.substring(0, maxCheckLength) : html;

    // Check for headings
    const hasHeadings = /<h[1-6][^>]*>/i.test(contentToCheck);
    if (!hasHeadings) {
      warnings.push('No heading tags found');
      suggestions.push('Add heading tags (h1, h2, etc.) to create better slide structure');
    }

    // Check for very long text blocks (limit regex complexity)
    try {
      const textBlocks = contentToCheck.match(/>([^<]{200,})</g);
      if (textBlocks && textBlocks.length > 0) {
        warnings.push('Very long text blocks detected');
        suggestions.push('Consider breaking long text into smaller paragraphs or bullet points');
      }
    } catch (error) {
      // Skip this check if regex fails
    }

    // Check for images without alt text
    try {
      const imagesWithoutAlt = contentToCheck.match(/<img(?![^>]*alt=)[^>]*>/gi);
      if (imagesWithoutAlt && imagesWithoutAlt.length > 0) {
        warnings.push('Images without alt text detected');
        suggestions.push('Add alt attributes to images for better accessibility');
      }
    } catch (error) {
      // Skip this check if regex fails
    }

    // Check for empty elements (limit to prevent performance issues)
    try {
      const emptyElements = contentToCheck.match(/<(\w+)[^>]*>\s*<\/\1>/g);
      if (emptyElements && emptyElements.length > 3) {
        warnings.push('Multiple empty elements detected');
        suggestions.push('Remove empty HTML elements to improve conversion quality');
      }
    } catch (error) {
      // Skip this check if regex fails
    }

    return { warnings, suggestions };
  }

  /**
   * Validate CSS selector
   * 
   * @private
   * @param selector - CSS selector to validate
   * @returns Validation result
   */
  private validateCSSSelector(selector: string): { isValid: boolean; error?: string } {
    try {
      // Basic validation - try to use the selector
      if (!selector || typeof selector !== 'string') {
        return { isValid: false, error: 'Selector must be a non-empty string' };
      }

      const trimmed = selector.trim();
      if (!trimmed) {
        return { isValid: false, error: 'Selector cannot be empty' };
      }

      // Try to create a test element and use querySelector
      // This is a basic check - in a real browser environment, we could use document.querySelector
      const basicSelectorPattern = /^[a-zA-Z0-9\-_#.\[\]:(),\s>+~*='"]+$/;
      if (!basicSelectorPattern.test(trimmed)) {
        return { isValid: false, error: 'Selector contains invalid characters' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid CSS selector syntax' };
    }
  }

  /**
   * Format bytes to human readable string
   * 
   * @private
   * @param bytes - Number of bytes
   * @returns Formatted string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}