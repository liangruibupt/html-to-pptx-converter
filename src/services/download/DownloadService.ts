import {
  DownloadService as DownloadServiceInterface,
  DownloadOptions,
  DownloadResult,
  FileInfo,
  DownloadError
} from './DownloadServiceInterface';

/**
 * Download Service Implementation
 * 
 * This service provides functionality for downloading generated PPTX files
 * with proper file naming and error handling.
 * 
 * Requirements:
 * - 4.1: Provide a download button for the generated PPTX file
 * - 4.3: Provide a meaningful default filename based on the original HTML content
 */
export class DownloadService implements DownloadServiceInterface {
  private downloadHistory: DownloadResult[] = [];
  private activeUrls: Set<string> = new Set();
  private maxHistorySize: number = 50;
  
  /**
   * Prepare a file for download
   * 
   * @param fileInfo - Information about the file to download
   * @param options - Download options
   * @returns Download result with URL and metadata
   */
  prepareDownload(fileInfo: FileInfo, options: DownloadOptions = {}): DownloadResult {
    try {
      // Validate file info
      if (!fileInfo.blob || fileInfo.blob.size === 0) {
        throw new DownloadError('Invalid file: Blob is empty or null', 'INVALID_FILE');
      }
      
      // Generate filename
      const filename = this.generateFilename(
        fileInfo.originalFilename,
        fileInfo.extension,
        options
      );
      
      // Create object URL for download
      const downloadUrl = URL.createObjectURL(fileInfo.blob);
      this.activeUrls.add(downloadUrl);
      
      // Prepare download result
      const downloadResult: DownloadResult = {
        filename,
        size: fileInfo.blob.size,
        downloadUrl,
        mimeType: options.mimeType || fileInfo.mimeType,
        preparedAt: new Date(),
        autoTriggered: false
      };
      
      // Add to history
      this.addToHistory(downloadResult);
      
      // Auto-trigger download if requested
      if (options.autoDownload) {
        this.triggerDownload(downloadResult).then(() => {
          downloadResult.autoTriggered = true;
        }).catch(error => {
          console.warn('Auto-download failed:', error);
        });
      }
      
      return downloadResult;
    } catch (error) {
      if (error instanceof DownloadError) {
        throw error;
      }
      throw new DownloadError(
        `Failed to prepare download: ${error instanceof Error ? error.message : String(error)}`,
        'PREPARATION_FAILED',
        error
      );
    }
  }
  
  /**
   * Trigger a download for a prepared file
   * 
   * @param downloadResult - Result from prepareDownload
   * @returns Promise that resolves when download is triggered
   */
  async triggerDownload(downloadResult: DownloadResult): Promise<void> {
    try {
      // Check if downloads are supported
      if (!this.isDownloadSupported()) {
        throw new DownloadError('Downloads are not supported in this environment', 'NOT_SUPPORTED');
      }
      
      // Validate download result
      if (!downloadResult.downloadUrl) {
        throw new DownloadError('Invalid download result: Missing download URL', 'INVALID_DOWNLOAD_RESULT');
      }
      
      // Create temporary anchor element for download
      const link = document.createElement('a');
      link.href = downloadResult.downloadUrl;
      link.download = downloadResult.filename;
      link.style.display = 'none';
      
      // Add to document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Update download result
      downloadResult.autoTriggered = true;
      
    } catch (error) {
      if (error instanceof DownloadError) {
        throw error;
      }
      throw new DownloadError(
        `Failed to trigger download: ${error instanceof Error ? error.message : String(error)}`,
        'TRIGGER_FAILED',
        error
      );
    }
  }
  
  /**
   * Generate a meaningful filename based on content or options
   * 
   * @param originalName - Original filename or content identifier
   * @param extension - File extension (without dot)
   * @param options - Additional options for filename generation
   * @returns Generated filename
   */
  generateFilename(originalName?: string, extension: string = 'pptx', options: DownloadOptions = {}): string {
    // Use custom filename if provided
    if (options.filename && options.filename.trim()) {
      const customName = this.sanitizeFilename(options.filename.trim());
      return this.ensureExtension(customName, extension);
    }
    
    // Use original name if available
    if (originalName && originalName.trim()) {
      const sanitizedOriginal = this.sanitizeFilename(originalName.trim());
      return this.ensureExtension(sanitizedOriginal, extension);
    }
    
    // Generate default filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const timeString = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    
    return `presentation-${timestamp}-${timeString}.${extension}`;
  }
  
  /**
   * Clean up download resources (revoke object URLs)
   * 
   * @param downloadResult - Download result to clean up
   */
  cleanupDownload(downloadResult: DownloadResult): void {
    try {
      if (downloadResult.downloadUrl && this.activeUrls.has(downloadResult.downloadUrl)) {
        URL.revokeObjectURL(downloadResult.downloadUrl);
        this.activeUrls.delete(downloadResult.downloadUrl);
      }
    } catch (error) {
      console.warn('Failed to cleanup download URL:', error);
    }
  }
  
  /**
   * Check if downloads are supported in the current environment
   * 
   * @returns True if downloads are supported
   */
  isDownloadSupported(): boolean {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return false;
      }
      
      // Check if URL.createObjectURL is available
      if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
        return false;
      }
      
      // Check if we can create anchor elements
      if (typeof document.createElement !== 'function') {
        return false;
      }
      
      // Test creating an anchor element
      const testLink = document.createElement('a');
      if (!testLink || typeof testLink.click !== 'function') {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get download statistics
   * 
   * @returns Download statistics
   */
  getDownloadStats(): {
    totalDownloads: number;
    totalSize: number;
    activeUrls: number;
    recentDownloads: DownloadResult[];
  } {
    const totalSize = this.downloadHistory.reduce((sum, download) => sum + download.size, 0);
    
    return {
      totalDownloads: this.downloadHistory.length,
      totalSize,
      activeUrls: this.activeUrls.size,
      recentDownloads: this.downloadHistory.slice(-10) // Last 10 downloads
    };
  }
  
  /**
   * Clean up all active download URLs
   */
  cleanupAllDownloads(): void {
    for (const url of this.activeUrls) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('Failed to revoke URL:', url, error);
      }
    }
    this.activeUrls.clear();
  }
  
  /**
   * Sanitize filename to remove invalid characters
   * 
   * @private
   * @param filename - Filename to sanitize
   * @returns Sanitized filename
   */
  private sanitizeFilename(filename: string): string {
    // Remove or replace invalid filename characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters with underscore
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 200); // Limit length to prevent issues
  }
  
  /**
   * Ensure filename has the correct extension
   * 
   * @private
   * @param filename - Filename to check
   * @param extension - Required extension (without dot)
   * @returns Filename with correct extension
   */
  private ensureExtension(filename: string, extension: string): string {
    const lowerFilename = filename.toLowerCase();
    const lowerExtension = extension.toLowerCase();
    
    if (lowerFilename.endsWith(`.${lowerExtension}`)) {
      return filename;
    }
    
    // Remove any existing extension that might be wrong
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex > 0 && lastDotIndex > filename.length - 6) {
      filename = filename.substring(0, lastDotIndex);
    }
    
    return `${filename}.${extension}`;
  }
  
  /**
   * Add download result to history
   * 
   * @private
   * @param downloadResult - Download result to add
   */
  private addToHistory(downloadResult: DownloadResult): void {
    this.downloadHistory.push(downloadResult);
    
    // Maintain maximum history size
    if (this.downloadHistory.length > this.maxHistorySize) {
      const removed = this.downloadHistory.shift();
      if (removed) {
        this.cleanupDownload(removed);
      }
    }
  }
  
  /**
   * Create a download service specifically for PPTX files
   * 
   * @param blob - PPTX blob to download
   * @param originalName - Original HTML filename or identifier
   * @param options - Download options
   * @returns Download result
   */
  downloadPptx(blob: Blob, originalName?: string, options: DownloadOptions = {}): DownloadResult {
    const fileInfo: FileInfo = {
      blob,
      originalFilename: originalName,
      extension: 'pptx',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      metadata: options.metadata
    };
    
    return this.prepareDownload(fileInfo, {
      ...options,
      mimeType: fileInfo.mimeType
    });
  }
  
  /**
   * Create a download link element for manual triggering
   * 
   * @param downloadResult - Download result
   * @param linkText - Text for the download link
   * @param className - CSS class for the link
   * @returns HTML anchor element
   */
  createDownloadLink(downloadResult: DownloadResult, linkText: string = 'Download', className?: string): HTMLAnchorElement {
    const link = document.createElement('a');
    link.href = downloadResult.downloadUrl;
    link.download = downloadResult.filename;
    link.textContent = linkText;
    
    if (className) {
      link.className = className;
    }
    
    // Add click handler for cleanup
    link.addEventListener('click', () => {
      // Cleanup after a short delay to allow download to start
      setTimeout(() => {
        this.cleanupDownload(downloadResult);
      }, 1000);
    });
    
    return link;
  }
}