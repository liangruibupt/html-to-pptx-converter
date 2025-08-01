import { v4 as uuidv4 } from 'uuid';

/**
 * ConversionOrchestrator - Main service for orchestrating HTML to PPTX conversions
 * Handles the conversion flow and progress tracking
 */
export class ConversionOrchestrator {
  constructor() {
    this.conversions = new Map(); // Store active conversions
    this.progressCallbacks = new Map(); // Store progress callbacks
  }

  /**
   * Start a new conversion process
   * @param {string} htmlContent - The HTML content to convert
   * @param {Object} options - Conversion options
   * @param {Function} progressCallback - Optional progress callback function
   * @returns {Promise<Object>} Conversion result with job ID
   */
  async startConversion(htmlContent, options = {}, progressCallback = null) {
    const jobId = uuidv4();
    
    // Initialize conversion tracking
    const conversionJob = {
      id: jobId,
      status: 'started',
      progress: 0,
      startTime: new Date(),
      htmlContent,
      options,
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
    
    if (progressCallback) {
      this.progressCallbacks.set(jobId, progressCallback);
    }

    // Start the conversion process asynchronously
    this._executeConversion(jobId).catch(error => {
      this._updateProgress(jobId, 'error', 100, error.message);
    });

    return {
      jobId,
      status: 'started',
      message: 'Conversion process initiated'
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
   * Execute the conversion process
   * @private
   * @param {string} jobId - The job ID
   */
  async _executeConversion(jobId) {
    const job = this.conversions.get(jobId);
    
    try {
      // Step 1: Parse HTML
      this._updateProgress(jobId, 'processing', 10, 'Parsing HTML content');
      await this._parseHtml(job.htmlContent);
      
      // Step 2: Extract content
      this._updateProgress(jobId, 'processing', 25, 'Extracting content structure');
      const extractedContent = await this._extractContent(job.htmlContent);
      
      // Step 3: Create slides
      this._updateProgress(jobId, 'processing', 45, 'Creating slide structure');
      const slides = await this._createSlides(extractedContent, job.options);
      
      // Step 4: Format content
      this._updateProgress(jobId, 'processing', 65, 'Formatting slide content');
      const formattedSlides = await this._formatContent(slides, job.options);
      
      // Step 5: Generate PPTX
      this._updateProgress(jobId, 'processing', 85, 'Generating PPTX file');
      const pptxBuffer = await this._generatePptx(formattedSlides, job.options);
      
      // Step 6: Finalize
      this._updateProgress(jobId, 'processing', 95, 'Finalizing conversion');
      const result = await this._finalizeConversion(pptxBuffer, job.options);
      
      // Complete
      job.result = result;
      job.completedAt = new Date();
      this._updateProgress(jobId, 'completed', 100, 'Conversion completed successfully');
      
    } catch (error) {
      job.error = error.message;
      job.completedAt = new Date();
      this._updateProgress(jobId, 'error', 100, `Conversion failed: ${error.message}`);
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
   */
  async _parseHtml(htmlContent) {
    // Simulate parsing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!htmlContent || typeof htmlContent !== 'string') {
      throw new Error('Invalid HTML content provided');
    }
    
    // Basic HTML validation
    if (!htmlContent.trim()) {
      throw new Error('Empty HTML content provided');
    }
    
    return { parsed: true };
  }

  /**
   * Extract content structure from HTML
   * @private
   * @param {string} htmlContent - Parsed HTML content
   */
  async _extractContent(htmlContent) {
    // Simulate content extraction delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock content extraction - in real implementation, this would parse HTML structure
    return {
      title: 'Extracted Title',
      sections: [
        { type: 'heading', content: 'Section 1', level: 1 },
        { type: 'paragraph', content: 'Sample content paragraph' },
        { type: 'list', items: ['Item 1', 'Item 2', 'Item 3'] }
      ]
    };
  }

  /**
   * Create slide structure from extracted content
   * @private
   * @param {Object} extractedContent - Extracted content structure
   * @param {Object} options - Conversion options
   */
  async _createSlides(extractedContent, options) {
    // Simulate slide creation delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const slides = [
      {
        id: 1,
        type: 'title',
        title: extractedContent.title,
        content: []
      }
    ];
    
    // Create content slides based on sections
    extractedContent.sections.forEach((section, index) => {
      slides.push({
        id: index + 2,
        type: 'content',
        title: section.type === 'heading' ? section.content : `Slide ${index + 2}`,
        content: [section]
      });
    });
    
    return slides;
  }

  /**
   * Format slide content according to options
   * @private
   * @param {Array} slides - Slide structure
   * @param {Object} options - Formatting options
   */
  async _formatContent(slides, options) {
    // Simulate formatting delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Apply formatting options (theme, fonts, colors, etc.)
    const formattedSlides = slides.map(slide => ({
      ...slide,
      theme: options.theme || 'default',
      fontSize: options.fontSize || 'medium',
      colorScheme: options.colorScheme || 'blue'
    }));
    
    return formattedSlides;
  }

  /**
   * Generate PPTX file from formatted slides
   * @private
   * @param {Array} formattedSlides - Formatted slide data
   * @param {Object} options - Generation options
   */
  async _generatePptx(formattedSlides, options) {
    // Simulate PPTX generation delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Mock PPTX buffer - in real implementation, this would use a PPTX library
    const mockPptxBuffer = Buffer.from('Mock PPTX content for ' + formattedSlides.length + ' slides');
    
    return mockPptxBuffer;
  }

  /**
   * Finalize conversion and prepare result
   * @private
   * @param {Buffer} pptxBuffer - Generated PPTX buffer
   * @param {Object} options - Conversion options
   */
  async _finalizeConversion(pptxBuffer, options) {
    // Simulate finalization delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      filename: options.filename || 'converted-presentation.pptx',
      size: pptxBuffer.length,
      format: 'pptx',
      slideCount: 3, // Mock slide count
      buffer: pptxBuffer,
      metadata: {
        createdAt: new Date(),
        converter: 'html-to-pptx-converter',
        version: '1.0.0'
      }
    };
  }
}

// Export singleton instance
export const conversionOrchestrator = new ConversionOrchestrator();