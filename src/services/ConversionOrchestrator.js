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
        throw new Error('Invalid HTML content: Content must be a non-empty string');
      }
      
      if (!htmlContent.trim()) {
        throw new Error('Invalid HTML content: Content cannot be empty or contain only whitespace');
      }
      
      // Use the HTMLParser service to parse the content
      const parsedContent = this.htmlParser.parseHTML(
        htmlContent,
        options.splitStrategy || 'BY_H1',
        options.customSelector
      );
      
      return parsedContent;
    } catch (error) {
      // Create a more specific error for HTML parsing
      const enhancedError = new Error(`HTML parsing failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.step = 'parsing_html';
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
        throw new Error('Parsed content is null or undefined');
      }
      
      if (!parsedContent.sections || parsedContent.sections.length === 0) {
        throw new Error('No content sections found in HTML. The HTML might be empty or contain only unsupported elements.');
      }
      
      // Validate that we have usable content
      const hasContent = parsedContent.sections.some(section => 
        section.content && section.content.trim().length > 0
      );
      
      if (!hasContent) {
        throw new Error('No usable content found in HTML sections. Please check that your HTML contains text, headings, or other supported elements.');
      }
      
      // Validate that we have at least one section with meaningful content
      const meaningfulSections = parsedContent.sections.filter(section => {
        const textContent = section.content.replace(/<[^>]*>/g, '').trim();
        return textContent.length > 0;
      });
      
      if (meaningfulSections.length === 0) {
        throw new Error('No meaningful content found. The HTML appears to contain only empty tags or formatting.');
      }
      
      return parsedContent;
    } catch (error) {
      // Create a more specific error for content extraction
      const enhancedError = new Error(`Content extraction failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.step = 'extracting_content';
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
        throw new Error('Invalid extracted content: Missing sections data');
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
        throw new Error('Slide creation returned null or undefined presentation');
      }
      
      return presentation;
    } catch (error) {
      // Create a more specific error for slide creation
      const enhancedError = new Error(`Slide creation failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.step = 'creating_slides';
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
        throw new Error('Invalid presentation: Presentation object is null or undefined');
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
        throw new Error('Generated PPTX file is empty or invalid');
      }
      
      // Check if blob is actually a PPTX file (basic validation)
      if (pptxBlob.type && !pptxBlob.type.includes('officedocument')) {
        console.warn('Generated blob may not be a valid PPTX file');
      }
      
      return pptxBlob;
    } catch (error) {
      // Create a more specific error for PPTX generation
      const enhancedError = new Error(`PPTX generation failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.step = 'generating_pptx';
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
}

// Export singleton instance
export const conversionOrchestrator = new ConversionOrchestrator();