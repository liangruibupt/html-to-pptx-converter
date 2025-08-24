import { v4 as uuidv4 } from 'uuid';
import { HTMLParser } from './parser/HTMLParser.ts';
import { PptxGenerator } from './pptx/PptxGenerator.ts';
import { SlideCreator } from './conversion/SlideCreator.ts';
import { ImageHandler } from './conversion/ImageHandler.ts';
import { TableHandler } from './conversion/TableHandler.ts';
import { ListHandler } from './conversion/ListHandler.ts';
import { LinkHandler } from './conversion/LinkHandler.ts';
import { ThemeHandler } from './conversion/ThemeHandler.ts';
import { ErrorHandler } from './error/ErrorHandler.ts';
import { conversionErrorRecoveryService } from './conversion/ConversionErrorRecovery.ts';

/**
 * ConversionOrchestrator - Main service for orchestrating HTML to PPTX conversions
 * Handles the conversion flow and progress tracking
 * 
 * Requirements:
 * - 3.1: Implement the main conversion flow
 * - 5.2: Add progress tracking functionality
 */
export class ConversionOrchestrator {
  constructor() {
    this.conversions = new Map(); // Store active conversions
    this.progressCallbacks = new Map(); // Store progress callbacks
    
    // Initialize service dependencies
    this.htmlParser = new HTMLParser();
    this.pptxGenerator = new PptxGenerator();
    this.imageHandler = new ImageHandler();
    this.tableHandler = new TableHandler();
    this.listHandler = new ListHandler();
    this.linkHandler = new LinkHandler();
    this.themeHandler = new ThemeHandler();
    this.errorHandler = new ErrorHandler();
    
    // Initialize slide creator with all dependencies
    this.slideCreator = new SlideCreator(
      this.pptxGenerator,
      this.imageHandler,
      this.tableHandler,
      this.listHandler,
      this.linkHandler,
      this.themeHandler
    );

    // Set up the error recovery service integration
    conversionErrorRecoveryService.setOrchestrator(this);
  }

  /**
   * Start a new conversion process
   * @param {string} htmlContent - The HTML content to convert
   * @param {Object} options - Conversion options
   * @param {Function} progressCallback - Optional progress callback function
   * @returns {Promise<Object>} Conversion result with job ID
   */
  async startConversion(htmlContent, options = {}, progressCallback = null) {
    // Validate inputs
    if (!htmlContent || typeof htmlContent !== 'string' || !htmlContent.trim()) {
      throw new Error('Invalid HTML content provided');
    }

    // Validate and normalize options
    const validatedOptions = this.validateOptions(options);
    
    const jobId = uuidv4();
    
    // Initialize conversion tracking
    const conversionJob = {
      id: jobId,
      status: 'started',
      progress: 0,
      startTime: new Date(),
      htmlContent: htmlContent.trim(),
      options: validatedOptions,
      steps: [
        'parsing_html',
        'extracting_content',
        'creating_slides',
        'formatting_content',
        'generating_pptx',
        'finalizing'
      ],
      currentStep: 0,
      result: null,
      error: null
    };

    this.conversions.set(jobId, conversionJob);
    
    if (progressCallback && typeof progressCallback === 'function') {
      this.progressCallbacks.set(jobId, progressCallback);
    }

    // Start the conversion process asynchronously
    this._executeConversion(jobId).catch(error => {
      this._updateProgress(jobId, 'error', 100, error.message);
    });

    return {
      jobId,
      status: 'started',
      message: 'Conversion process initiated',
      options: validatedOptions
    };
  }

  /**
   * Get the status of a conversion job
   * @param {string} jobId - The job ID
   * @returns {Object} Job status information
   */
  getConversionStatus(jobId) {
    const job = this.conversions.get(jobId);
    
    if (!job) {
      return {
        error: 'Job not found',
        status: 'not_found'
      };
    }

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      currentStep: job.steps[job.currentStep] || 'unknown',
      startTime: job.startTime,
      error: job.error,
      result: job.result
    };
  }

  /**
   * Get the result of a completed conversion
   * @param {string} jobId - The job ID
   * @returns {Object} Conversion result or error
   */
  getConversionResult(jobId) {
    const job = this.conversions.get(jobId);
    
    if (!job) {
      return {
        error: 'Job not found',
        status: 'not_found'
      };
    }

    if (job.status !== 'completed' && job.status !== 'error') {
      return {
        error: 'Conversion not yet completed',
        status: job.status,
        progress: job.progress
      };
    }

    return {
      jobId: job.id,
      status: job.status,
      result: job.result,
      error: job.error,
      completedAt: job.completedAt
    };
  }

  /**
   * Cancel a running conversion
   * @param {string} jobId - The job ID to cancel
   * @returns {Object} Cancellation result
   */
  cancelConversion(jobId) {
    const job = this.conversions.get(jobId);
    
    if (!job) {
      return {
        error: 'Job not found',
        status: 'not_found'
      };
    }

    if (job.status === 'completed' || job.status === 'error') {
      return {
        error: 'Cannot cancel completed or failed job',
        status: job.status
      };
    }

    job.status = 'cancelled';
    job.completedAt = new Date();
    
    return {
      jobId,
      status: 'cancelled',
      message: 'Conversion cancelled successfully'
    };
  }

  /**
   * Clean up completed or old conversion jobs
   * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
   */
  cleanupJobs(maxAge = 3600000) {
    const now = new Date();
    const jobsToRemove = [];

    for (const [jobId, job] of this.conversions.entries()) {
      const jobAge = now - job.startTime;
      
      if (jobAge > maxAge && (job.status === 'completed' || job.status === 'error' || job.status === 'cancelled')) {
        // Clean up any object URLs to prevent memory leaks
        if (job.result && job.result.downloadUrl) {
          try {
            URL.revokeObjectURL(job.result.downloadUrl);
          } catch (error) {
            console.warn(`Failed to revoke object URL for job ${jobId}:`, error);
          }
        }
        
        jobsToRemove.push(jobId);
      }
    }

    jobsToRemove.forEach(jobId => {
      this.conversions.delete(jobId);
      this.progressCallbacks.delete(jobId);
    });

    return {
      cleaned: jobsToRemove.length,
      remaining: this.conversions.size
    };
  }

  /**
   * Get statistics about active conversions
   * @returns {Object} Conversion statistics
   */
  getConversionStats() {
    const stats = {
      total: this.conversions.size,
      started: 0,
      processing: 0,
      completed: 0,
      error: 0,
      cancelled: 0
    };

    for (const job of this.conversions.values()) {
      if (stats.hasOwnProperty(job.status)) {
        stats[job.status]++;
      }
    }

    return stats;
  }

  /**
   * Validate conversion options
   * @param {Object} options - Options to validate
   * @returns {Object} Validated options with defaults applied
   */
  validateOptions(options = {}) {
    const validatedOptions = {
      // Slide layout options
      slideLayout: ['STANDARD', 'WIDE', 'CUSTOM'].includes(options.slideLayout) 
        ? options.slideLayout : 'WIDE',
      
      // Content options
      includeImages: options.includeImages !== false,
      preserveLinks: options.preserveLinks !== false,
      
      // Theme options
      theme: ['DEFAULT', 'PROFESSIONAL', 'CREATIVE', 'MINIMAL'].includes(options.theme)
        ? options.theme : 'DEFAULT',
      
      // Splitting options
      splitStrategy: ['BY_H1', 'BY_H2', 'BY_CUSTOM_SELECTOR', 'NO_SPLIT'].includes(options.splitStrategy)
        ? options.splitStrategy : 'BY_H1',
      
      // Custom selector for splitting
      customSelector: typeof options.customSelector === 'string' 
        ? options.customSelector : undefined,
      
      // File naming
      filename: typeof options.filename === 'string' && options.filename.trim()
        ? options.filename.trim() : undefined,
      
      // Custom styles
      customStyles: typeof options.customStyles === 'object' && options.customStyles !== null
        ? options.customStyles : {},
      
      // Image processing options
      imageOptions: typeof options.imageOptions === 'object' && options.imageOptions !== null
        ? options.imageOptions : {}
    };

    return validatedOptions;
  }

  /**
   * Get error information for a conversion job
   * @param {string} jobId - The job ID
   * @returns {Object} Error information or null if no error
   */
  getConversionError(jobId) {
    const job = this.conversions.get(jobId);
    
    if (!job) {
      return {
        error: 'Job not found',
        status: 'not_found'
      };
    }

    if (job.status !== 'error' || !job.error) {
      return {
        error: 'No error found for this job',
        status: job.status
      };
    }

    return {
      jobId: job.id,
      error: job.error,
      userMessage: this.errorHandler.createUserFriendlyMessage(job.error),
      suggestions: this.errorHandler.getSuggestions(job.error),
      recoverable: job.error.recoverable,
      timestamp: job.error.timestamp
    };
  }

  /**
   * Retry a failed conversion with the same parameters
   * @param {string} jobId - The job ID to retry
   * @param {Function} progressCallback - Optional progress callback function
   * @returns {Promise<Object>} New conversion result with new job ID
   */
  async retryConversion(jobId, progressCallback = null) {
    const job = this.conversions.get(jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'error') {
      throw new Error('Can only retry failed conversions');
    }

    if (!job.error || !job.error.recoverable) {
      throw new Error('This error is not recoverable. Please check your input and try again.');
    }

    // Start a new conversion with the same parameters
    return await this.startConversion(job.htmlContent, job.options, progressCallback);
  }

  /**
   * Retry a failed conversion with recovery options applied
   * @param {string} jobId - The job ID to retry
   * @param {Object} recoveryOptions - Recovery options to apply
   * @param {Function} progressCallback - Optional progress callback function
   * @returns {Promise<Object>} New conversion result with new job ID
   */
  async retryConversionWithRecovery(jobId, recoveryOptions = {}, progressCallback = null) {
    const job = this.conversions.get(jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'error') {
      throw new Error('Can only retry failed conversions');
    }

    if (!job.error) {
      throw new Error('No error information available for recovery');
    }

    // Apply recovery options to the original options
    const recoveredOptions = this._applyRecoveryOptions(job.options, job.error, recoveryOptions);
    
    // Start a new conversion with recovered options
    return await this.startConversion(job.htmlContent, recoveredOptions, progressCallback);
  }

  /**
   * Get recovery suggestions for a failed conversion
   * @param {string} jobId - The job ID
   * @returns {Object} Recovery suggestions and options
   */
  getRecoveryOptions(jobId) {
    const job = this.conversions.get(jobId);
    
    if (!job) {
      return {
        error: 'Job not found',
        status: 'not_found'
      };
    }

    if (job.status !== 'error' || !job.error) {
      return {
        error: 'No error found for this job',
        status: job.status
      };
    }

    return this._generateRecoveryOptions(job.error, job.options, job.htmlContent);
  }

  /**
   * Attempt automatic recovery for a failed conversion
   * @param {string} jobId - The job ID to recover
   * @param {Function} progressCallback - Optional progress callback function
   * @returns {Promise<Object>} Recovery result
   */
  async attemptAutoRecovery(jobId, progressCallback = null) {
    const job = this.conversions.get(jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'error' || !job.error) {
      throw new Error('No error to recover from');
    }

    // Check if automatic recovery is possible
    const autoRecoveryOptions = this._getAutoRecoveryOptions(job.error, job.options);
    
    if (!autoRecoveryOptions.canAutoRecover) {
      throw new Error('Automatic recovery is not possible for this error type');
    }

    // Apply automatic recovery options
    const recoveredOptions = this._applyRecoveryOptions(job.options, job.error, autoRecoveryOptions.options);
    
    // Start a new conversion with auto-recovered options
    return await this.startConversion(job.htmlContent, recoveredOptions, progressCallback);
  }

  /**
   * Get error statistics from the error handler
   * @returns {Object} Error statistics
   */
  getErrorStatistics() {
    return this.errorHandler.getErrorStats();
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHandler.clearErrorHistory();
  }

  /**
   * Execute the conversion process
   * @private
   * @param {string} jobId - The job ID
   */
  async _executeConversion(jobId) {
    const job = this.conversions.get(jobId);
    
    try {
      // Step 1: Parse HTML
      this._updateProgress(jobId, 'processing', 10, 'Parsing HTML content');
      const parsedContent = await this._parseHtml(job.htmlContent, job.options);
      
      // Step 2: Extract content
      this._updateProgress(jobId, 'processing', 25, 'Extracting content structure');
      const extractedContent = await this._extractContent(parsedContent);
      
      // Step 3: Create slides
      this._updateProgress(jobId, 'processing', 45, 'Creating slide structure');
      const presentation = await this._createSlides(extractedContent, job.options);
      
      // Step 4: Format content
      this._updateProgress(jobId, 'processing', 65, 'Formatting slide content');
      const formattedPresentation = await this._formatContent(presentation, job.options);
      
      // Step 5: Generate PPTX
      this._updateProgress(jobId, 'processing', 85, 'Generating PPTX file');
      const pptxBlob = await this._generatePptx(formattedPresentation, job.options);
      
      // Step 6: Finalize
      this._updateProgress(jobId, 'processing', 95, 'Finalizing conversion');
      const result = await this._finalizeConversion(pptxBlob, job.options);
      
      // Complete
      job.result = result;
      job.completedAt = new Date();
      this._updateProgress(jobId, 'completed', 100, 'Conversion completed successfully');
      
    } catch (error) {
      // Handle the error using the error handler
      const conversionError = this.errorHandler.handleError(error, {
        jobId,
        step: job.steps[job.currentStep] || 'unknown',
        htmlContent: job.htmlContent,
        options: job.options
      });
      
      job.error = conversionError;
      job.completedAt = new Date();
      
      // Create user-friendly error message
      const userMessage = this.errorHandler.createUserFriendlyMessage(conversionError);
      
      // Attempt automatic recovery if possible
      const autoRecoveryResult = await this._attemptAutoRecoveryInternal(jobId, conversionError);
      
      if (autoRecoveryResult.recovered) {
        // Auto-recovery succeeded, continue with the recovered conversion
        return;
      }
      
      this._updateProgress(jobId, 'error', 100, userMessage);
    }
  }

  /**
   * Update progress and notify callbacks
   * @private
   * @param {string} jobId - The job ID
   * @param {string} status - Current status
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} message - Progress message
   */
  _updateProgress(jobId, status, progress, message) {
    const job = this.conversions.get(jobId);
    if (!job) return;

    job.status = status;
    job.progress = progress;
    job.currentStep = Math.floor((progress / 100) * job.steps.length);

    // Call progress callback if registered
    const callback = this.progressCallbacks.get(jobId);
    if (callback && typeof callback === 'function') {
      try {
        callback({
          jobId,
          status,
          progress,
          message,
          currentStep: job.steps[job.currentStep] || 'unknown'
        });
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    }
  }

  /**
   * Parse HTML content
   * @private
   * @param {string} htmlContent - HTML content to parse
   * @param {Object} options - Parsing options
   */
  async _parseHtml(htmlContent, options = {}) {
    try {
      // Validate HTML content before parsing
      if (!htmlContent || typeof htmlContent !== 'string') {
        const error = new Error('Invalid HTML content: Content must be a non-empty string');
        error.code = 'INVALID_HTML_TYPE';
        error.recoverable = false;
        error.category = 'VALIDATION';
        throw error;
      }
      
      if (!htmlContent.trim()) {
        const error = new Error('Invalid HTML content: Content cannot be empty or contain only whitespace');
        error.code = 'EMPTY_HTML_CONTENT';
        error.recoverable = false;
        error.category = 'VALIDATION';
        throw error;
      }

      // Check for extremely large content that might cause memory issues
      if (htmlContent.length > 10 * 1024 * 1024) { // 10MB
        const error = new Error('HTML content is too large and may cause memory issues');
        error.code = 'HTML_TOO_LARGE';
        error.recoverable = true;
        error.category = 'PARSING';
        throw error;
      }

      // Check for basic HTML structure
      if (!/<[a-z][\s\S]*>/i.test(htmlContent)) {
        const error = new Error('Content does not appear to contain valid HTML tags');
        error.code = 'INVALID_HTML_FORMAT';
        error.recoverable = true;
        error.category = 'PARSING';
        throw error;
      }
      
      // Use the HTMLParser service to parse the content
      const parsedContent = this.htmlParser.parseHTML(
        htmlContent,
        options.splitStrategy || 'BY_H1',
        options.customSelector
      );
      
      return parsedContent;
    } catch (error) {
      // Enhance error with parsing context if not already enhanced
      if (!error.code) {
        error.code = 'HTML_PARSING_ERROR';
        error.recoverable = true;
        error.category = 'PARSING';
      }
      
      // Create a more specific error for HTML parsing
      const enhancedError = new Error(`HTML parsing failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.step = 'parsing_html';
      enhancedError.code = error.code;
      enhancedError.recoverable = error.recoverable;
      enhancedError.category = error.category;
      throw enhancedError;
    }
  }

  /**
   * Extract content structure from HTML
   * @private
   * @param {Object} parsedContent - Parsed HTML content from HTMLParser
   */
  async _extractContent(parsedContent) {
    try {
      // The HTMLParser already extracts the content structure
      // This step validates and enriches the extracted content
      
      if (!parsedContent) {
        const error = new Error('Parsed content is null or undefined');
        error.code = 'NULL_PARSED_CONTENT';
        error.recoverable = false;
        error.category = 'PARSING';
        throw error;
      }
      
      if (!parsedContent.sections || parsedContent.sections.length === 0) {
        const error = new Error('No content sections found in HTML. The HTML might be empty or contain only unsupported elements.');
        error.code = 'NO_CONTENT_SECTIONS';
        error.recoverable = true;
        error.category = 'PARSING';
        throw error;
      }
      
      // Validate that we have usable content
      const hasContent = parsedContent.sections.some(section => 
        section.content && section.content.trim().length > 0
      );
      
      if (!hasContent) {
        const error = new Error('No usable content found in HTML sections. Please check that your HTML contains text, headings, or other supported elements.');
        error.code = 'NO_USABLE_CONTENT';
        error.recoverable = true;
        error.category = 'PARSING';
        throw error;
      }
      
      // Validate that we have at least one section with meaningful content
      const meaningfulSections = parsedContent.sections.filter(section => {
        const textContent = section.content.replace(/<[^>]*>/g, '').trim();
        return textContent.length > 0;
      });
      
      if (meaningfulSections.length === 0) {
        const error = new Error('No meaningful content found. The HTML appears to contain only empty tags or formatting.');
        error.code = 'NO_MEANINGFUL_CONTENT';
        error.recoverable = true;
        error.category = 'PARSING';
        throw error;
      }

      // Check for potential issues that might cause problems later
      const totalContentSize = parsedContent.sections.reduce((size, section) => {
        return size + (section.content ? section.content.length : 0);
      }, 0);

      if (totalContentSize > 5 * 1024 * 1024) { // 5MB of content
        console.warn('Large amount of content detected, this may cause performance issues');
      }

      // Count complex elements that might cause issues
      const imageCount = (JSON.stringify(parsedContent).match(/<img/gi) || []).length;
      const tableCount = (JSON.stringify(parsedContent).match(/<table/gi) || []).length;
      
      if (imageCount > 50) {
        console.warn(`Large number of images detected (${imageCount}), consider reducing for better performance`);
      }
      
      if (tableCount > 20) {
        console.warn(`Large number of tables detected (${tableCount}), this may affect conversion performance`);
      }
      
      return parsedContent;
    } catch (error) {
      // Enhance error with extraction context if not already enhanced
      if (!error.code) {
        error.code = 'CONTENT_EXTRACTION_ERROR';
        error.recoverable = true;
        error.category = 'PARSING';
      }
      
      // Create a more specific error for content extraction
      const enhancedError = new Error(`Content extraction failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.step = 'extracting_content';
      enhancedError.code = error.code;
      enhancedError.recoverable = error.recoverable;
      enhancedError.category = error.category;
      throw enhancedError;
    }
  }

  /**
   * Create slide structure from extracted content
   * @private
   * @param {Object} extractedContent - Extracted content structure
   * @param {Object} options - Conversion options
   */
  async _createSlides(extractedContent, options) {
    try {
      // Validate extracted content
      if (!extractedContent || !extractedContent.sections) {
        const error = new Error('Invalid extracted content: Missing sections data');
        error.code = 'INVALID_EXTRACTED_CONTENT';
        error.recoverable = false;
        error.category = 'CONVERSION';
        throw error;
      }

      // Check for potential slide creation issues
      const sectionCount = extractedContent.sections.length;
      if (sectionCount > 100) {
        const error = new Error(`Too many sections (${sectionCount}) may cause performance issues or memory problems`);
        error.code = 'TOO_MANY_SECTIONS';
        error.recoverable = true;
        error.category = 'CONVERSION';
        throw error;
      }
      
      // Create conversion configuration from options
      const config = {
        slideLayout: options.slideLayout || 'WIDE',
        includeImages: options.includeImages !== false,
        theme: options.theme || 'DEFAULT',
        splitSections: options.splitSections || 'BY_H1',
        preserveLinks: options.preserveLinks !== false,
        customStyles: options.customStyles || {},
        imageOptions: options.imageOptions || {}
      };
      
      // Validate configuration
      const validLayouts = ['STANDARD', 'WIDE', 'CUSTOM'];
      if (!validLayouts.includes(config.slideLayout)) {
        console.warn(`Invalid slide layout '${config.slideLayout}', using 'WIDE' as fallback`);
        config.slideLayout = 'WIDE';
      }
      
      const validThemes = ['DEFAULT', 'PROFESSIONAL', 'CREATIVE', 'MINIMAL'];
      if (!validThemes.includes(config.theme)) {
        console.warn(`Invalid theme '${config.theme}', using 'DEFAULT' as fallback`);
        config.theme = 'DEFAULT';
      }
      
      // Use the SlideCreator service to create slides
      const presentation = await this.slideCreator.createSlides(extractedContent, config);
      
      if (!presentation) {
        const error = new Error('Slide creation returned null or undefined presentation');
        error.code = 'NULL_PRESENTATION';
        error.recoverable = true;
        error.category = 'CONVERSION';
        throw error;
      }

      // Validate the created presentation
      if (typeof presentation.slides === 'undefined' || presentation.slides.length === 0) {
        const error = new Error('No slides were created from the content');
        error.code = 'NO_SLIDES_CREATED';
        error.recoverable = true;
        error.category = 'CONVERSION';
        throw error;
      }
      
      return presentation;
    } catch (error) {
      // Enhance error with slide creation context if not already enhanced
      if (!error.code) {
        error.code = 'SLIDE_CREATION_ERROR';
        error.recoverable = true;
        error.category = 'CONVERSION';
      }
      
      // Create a more specific error for slide creation
      const enhancedError = new Error(`Slide creation failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.step = 'creating_slides';
      enhancedError.code = error.code;
      enhancedError.recoverable = error.recoverable;
      enhancedError.category = error.category;
      throw enhancedError;
    }
  }

  /**
   * Format slide content according to options
   * @private
   * @param {Object} presentation - Presentation object from SlideCreator
   * @param {Object} options - Formatting options
   */
  async _formatContent(presentation, options) {
    // The SlideCreator already handles formatting during slide creation
    // This step can be used for any additional post-processing
    
    try {
      // Apply any additional theme customizations if specified
      if (options.customStyles && Object.keys(options.customStyles).length > 0) {
        // Apply custom styles to the presentation
        this.themeHandler.applyCustomStyles(presentation, options.customStyles);
      }
      
      return presentation;
    } catch (error) {
      console.warn(`Warning: Failed to apply custom formatting: ${error.message}`);
      // Return the presentation even if custom formatting fails
      return presentation;
    }
  }

  /**
   * Generate PPTX file from formatted presentation
   * @private
   * @param {Object} presentation - Formatted presentation object
   * @param {Object} options - Generation options
   */
  async _generatePptx(presentation, options) {
    try {
      // Validate presentation object
      if (!presentation) {
        const error = new Error('Invalid presentation: Presentation object is null or undefined');
        error.code = 'NULL_PRESENTATION';
        error.recoverable = false;
        error.category = 'GENERATION';
        throw error;
      }

      // Check for potential memory issues with large presentations
      if (presentation.slides && presentation.slides.length > 200) {
        const error = new Error(`Presentation has too many slides (${presentation.slides.length}). This may cause memory issues.`);
        error.code = 'TOO_MANY_SLIDES';
        error.recoverable = true;
        error.category = 'GENERATION';
        throw error;
      }
      
      // Generate filename from options or use default
      let fileName = options.filename || `presentation_${Date.now()}.pptx`;
      
      // Validate and sanitize filename
      if (typeof fileName !== 'string' || !fileName.trim()) {
        fileName = `presentation_${Date.now()}.pptx`;
      } else {
        // Ensure filename has .pptx extension
        if (!fileName.toLowerCase().endsWith('.pptx')) {
          fileName += '.pptx';
        }
        
        // Sanitize filename (remove invalid characters)
        fileName = fileName.replace(/[<>:"/\\|?*]/g, '_');
      }
      
      // Use the PptxGenerator service to save the presentation
      const pptxBlob = await this.pptxGenerator.savePresentation(presentation, fileName);
      
      // Validate the generated blob
      if (!pptxBlob || pptxBlob.size === 0) {
        const error = new Error('Generated PPTX file is empty or invalid');
        error.code = 'EMPTY_PPTX_FILE';
        error.recoverable = true;
        error.category = 'GENERATION';
        throw error;
      }

      // Check for suspiciously small files that might indicate generation issues
      if (pptxBlob.size < 10000) { // Less than 10KB is suspicious for a PPTX file
        console.warn(`Generated PPTX file is very small (${pptxBlob.size} bytes), this might indicate generation issues`);
      }
      
      // Check if blob is actually a PPTX file (basic validation)
      if (pptxBlob.type && !pptxBlob.type.includes('officedocument')) {
        console.warn('Generated blob may not be a valid PPTX file');
      }
      
      return pptxBlob;
    } catch (error) {
      // Enhance error with PPTX generation context if not already enhanced
      if (!error.code) {
        error.code = 'PPTX_GENERATION_ERROR';
        error.recoverable = true;
        error.category = 'GENERATION';
      }
      
      // Create a more specific error for PPTX generation
      const enhancedError = new Error(`PPTX generation failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.step = 'generating_pptx';
      enhancedError.code = error.code;
      enhancedError.recoverable = error.recoverable;
      enhancedError.category = error.category;
      throw enhancedError;
    }
  }

  /**
   * Finalize conversion and prepare result
   * @private
   * @param {Blob} pptxBlob - Generated PPTX blob
   * @param {Object} options - Conversion options
   */
  async _finalizeConversion(pptxBlob, options) {
    try {
      // Calculate slide count from the original sections
      const job = Array.from(this.conversions.values()).find(j => j.options === options);
      const slideCount = job?.htmlContent ? 
        (job.htmlContent.match(/<h[1-6]/gi) || []).length || 1 : 1;
      
      return {
        filename: options.filename || 'converted-presentation.pptx',
        size: pptxBlob.size,
        format: 'pptx',
        slideCount: slideCount,
        blob: pptxBlob,
        downloadUrl: URL.createObjectURL(pptxBlob),
        metadata: {
          createdAt: new Date(),
          converter: 'html-to-pptx-converter',
          version: '1.0.0',
          options: {
            theme: options.theme,
            slideLayout: options.slideLayout,
            includeImages: options.includeImages,
            preserveLinks: options.preserveLinks
          }
        }
      };
    } catch (error) {
      throw new Error(`Conversion finalization failed: ${error.message}`);
    }
  }

  /**
   * Apply recovery options to conversion options
   * @private
   * @param {Object} originalOptions - Original conversion options
   * @param {Object} error - Conversion error
   * @param {Object} recoveryOptions - Recovery options to apply
   * @returns {Object} Modified options with recovery applied
   */
  _applyRecoveryOptions(originalOptions, error, recoveryOptions) {
    const recoveredOptions = { ...originalOptions };
    
    // Apply recovery options based on error type and recovery suggestions
    if (recoveryOptions.simplifyContent) {
      recoveredOptions.includeImages = false;
      recoveredOptions.preserveLinks = false;
      recoveredOptions.customStyles = {};
    }
    
    if (recoveryOptions.changeTheme) {
      recoveredOptions.theme = recoveryOptions.fallbackTheme || 'DEFAULT';
    }
    
    if (recoveryOptions.changeLayout) {
      recoveredOptions.slideLayout = recoveryOptions.fallbackLayout || 'STANDARD';
    }
    
    if (recoveryOptions.changeSplitStrategy) {
      recoveredOptions.splitStrategy = recoveryOptions.fallbackSplitStrategy || 'BY_H1';
      if (recoveredOptions.splitStrategy !== 'BY_CUSTOM_SELECTOR') {
        delete recoveredOptions.customSelector;
      }
    }
    
    if (recoveryOptions.reduceComplexity) {
      recoveredOptions.includeImages = false;
      recoveredOptions.imageOptions = { maxWidth: 400, maxHeight: 300 };
      recoveredOptions.customStyles = {};
    }
    
    if (recoveryOptions.useCompatibilityMode) {
      recoveredOptions.slideLayout = 'STANDARD';
      recoveredOptions.theme = 'DEFAULT';
      recoveredOptions.includeImages = false;
      recoveredOptions.preserveLinks = false;
      recoveredOptions.customStyles = {};
    }
    
    return recoveredOptions;
  }

  /**
   * Generate recovery options for a conversion error
   * @private
   * @param {Object} error - Conversion error
   * @param {Object} options - Original conversion options
   * @param {string} htmlContent - HTML content
   * @returns {Object} Recovery options and suggestions
   */
  _generateRecoveryOptions(error, options, htmlContent) {
    const recoveryOptions = {
      canRecover: error.recoverable,
      autoRecoveryAvailable: false,
      suggestions: [...(error.suggestions || [])],
      options: []
    };

    // Generate recovery options based on error category and context
    switch (error.category) {
      case 'PARSING':
        recoveryOptions.options.push(
          {
            id: 'simplify_html',
            title: 'Simplify HTML Content',
            description: 'Remove complex HTML elements that might be causing parsing issues',
            action: 'simplifyContent',
            automatic: false,
            impact: 'May lose some formatting and content elements'
          },
          {
            id: 'change_split_strategy',
            title: 'Change Section Splitting',
            description: 'Use a simpler section splitting strategy',
            action: 'changeSplitStrategy',
            automatic: true,
            fallbackSplitStrategy: 'BY_H1',
            impact: 'Content may be organized differently'
          }
        );
        recoveryOptions.autoRecoveryAvailable = true;
        break;

      case 'GENERATION':
        recoveryOptions.options.push(
          {
            id: 'reduce_complexity',
            title: 'Reduce Content Complexity',
            description: 'Disable images and complex formatting to reduce generation load',
            action: 'reduceComplexity',
            automatic: true,
            impact: 'Images and advanced formatting will be removed'
          },
          {
            id: 'change_theme',
            title: 'Use Default Theme',
            description: 'Switch to the default theme which is more stable',
            action: 'changeTheme',
            automatic: true,
            fallbackTheme: 'DEFAULT',
            impact: 'Presentation will use default styling'
          },
          {
            id: 'change_layout',
            title: 'Use Standard Layout',
            description: 'Switch to standard slide layout for better compatibility',
            action: 'changeLayout',
            automatic: true,
            fallbackLayout: 'STANDARD',
            impact: 'Slides will use standard 4:3 layout'
          }
        );
        recoveryOptions.autoRecoveryAvailable = true;
        break;

      case 'CONVERSION':
        recoveryOptions.options.push(
          {
            id: 'compatibility_mode',
            title: 'Use Compatibility Mode',
            description: 'Use the most compatible settings for conversion',
            action: 'useCompatibilityMode',
            automatic: true,
            impact: 'All advanced features will be disabled for maximum compatibility'
          },
          {
            id: 'simplify_content',
            title: 'Simplify Content',
            description: 'Remove images and complex elements',
            action: 'simplifyContent',
            automatic: false,
            impact: 'Images and complex formatting will be removed'
          }
        );
        recoveryOptions.autoRecoveryAvailable = true;
        break;

      case 'VALIDATION':
        recoveryOptions.options.push(
          {
            id: 'fix_validation',
            title: 'Fix Validation Issues',
            description: 'Automatically fix common validation problems',
            action: 'fixValidation',
            automatic: true,
            impact: 'Some content may be modified to meet validation requirements'
          }
        );
        recoveryOptions.autoRecoveryAvailable = true;
        break;

      default:
        recoveryOptions.options.push(
          {
            id: 'use_safe_defaults',
            title: 'Use Safe Defaults',
            description: 'Reset all options to safe default values',
            action: 'useSafeDefaults',
            automatic: true,
            impact: 'All custom settings will be reset to defaults'
          }
        );
        recoveryOptions.autoRecoveryAvailable = true;
    }

    // Add content-specific recovery options
    if (htmlContent && htmlContent.length > 100000) {
      recoveryOptions.options.push({
        id: 'reduce_content_size',
        title: 'Reduce Content Size',
        description: 'The HTML content is very large. Try reducing its size.',
        action: 'reduceContentSize',
        automatic: false,
        impact: 'You may need to split your content into smaller parts'
      });
    }

    if (options.includeImages && (htmlContent.match(/<img/gi) || []).length > 10) {
      recoveryOptions.options.push({
        id: 'disable_images',
        title: 'Disable Images',
        description: 'Disable image processing to reduce complexity',
        action: 'disableImages',
        automatic: true,
        impact: 'Images will not be included in the presentation'
      });
    }

    return recoveryOptions;
  }

  /**
   * Get automatic recovery options for an error
   * @private
   * @param {Object} error - Conversion error
   * @param {Object} options - Original conversion options
   * @returns {Object} Auto recovery options
   */
  _getAutoRecoveryOptions(error, options) {
    const autoRecovery = {
      canAutoRecover: false,
      options: {}
    };

    // Only attempt auto-recovery for recoverable errors
    if (!error.recoverable) {
      return autoRecovery;
    }

    // Define auto-recovery strategies based on error patterns
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('parsing') || errorMessage.includes('html')) {
      autoRecovery.canAutoRecover = true;
      autoRecovery.options = {
        changeSplitStrategy: true,
        fallbackSplitStrategy: 'BY_H1'
      };
    } else if (errorMessage.includes('generation') || errorMessage.includes('pptx')) {
      autoRecovery.canAutoRecover = true;
      autoRecovery.options = {
        reduceComplexity: true,
        changeTheme: true,
        fallbackTheme: 'DEFAULT'
      };
    } else if (errorMessage.includes('memory') || errorMessage.includes('size')) {
      autoRecovery.canAutoRecover = true;
      autoRecovery.options = {
        simplifyContent: true,
        reduceComplexity: true
      };
    } else if (errorMessage.includes('validation')) {
      autoRecovery.canAutoRecover = true;
      autoRecovery.options = {
        fixValidation: true
      };
    } else if (error.category === 'CONVERSION') {
      autoRecovery.canAutoRecover = true;
      autoRecovery.options = {
        useCompatibilityMode: true
      };
    }

    return autoRecovery;
  }

  /**
   * Attempt automatic recovery internally during conversion
   * @private
   * @param {string} jobId - The job ID
   * @param {Object} error - Conversion error
   * @returns {Promise<Object>} Recovery result
   */
  async _attemptAutoRecoveryInternal(jobId, error) {
    const job = this.conversions.get(jobId);
    
    if (!job || !error.recoverable) {
      return { recovered: false, reason: 'Not recoverable' };
    }

    // Check if we've already attempted recovery for this job
    if (job.recoveryAttempts && job.recoveryAttempts >= 2) {
      return { recovered: false, reason: 'Maximum recovery attempts reached' };
    }

    // Initialize recovery attempts counter
    if (!job.recoveryAttempts) {
      job.recoveryAttempts = 0;
    }

    const autoRecoveryOptions = this._getAutoRecoveryOptions(error, job.options);
    
    if (!autoRecoveryOptions.canAutoRecover) {
      return { recovered: false, reason: 'No auto-recovery strategy available' };
    }

    try {
      // Increment recovery attempts
      job.recoveryAttempts++;
      
      // Apply recovery options
      const recoveredOptions = this._applyRecoveryOptions(job.options, error, autoRecoveryOptions.options);
      
      // Update job options for recovery attempt
      job.options = recoveredOptions;
      job.status = 'processing';
      job.error = null;
      
      // Update progress to indicate recovery attempt
      this._updateProgress(jobId, 'processing', 5, `Attempting automatic recovery (attempt ${job.recoveryAttempts})...`);
      
      // Restart the conversion process with recovered options
      await this._executeConversion(jobId);
      
      return { recovered: true, recoveryOptions: autoRecoveryOptions.options };
      
    } catch (recoveryError) {
      // Recovery failed, restore original error
      job.error = error;
      return { recovered: false, reason: `Recovery failed: ${recoveryError.message}` };
    }
  }
}

// Export singleton instance
export const conversionOrchestrator = new ConversionOrchestrator();