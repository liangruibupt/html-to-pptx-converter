/**
 * Download Service Interface
 * 
 * This interface defines the contract for download services in the HTML to PPTX converter.
 * 
 * Requirements:
 * - 4.1: Provide a download button for the generated PPTX file
 * - 4.3: Provide a meaningful default filename based on the original HTML content
 */

/**
 * Download options for customizing the download behavior
 */
export interface DownloadOptions {
  /** Custom filename for the download (without extension) */
  filename?: string;
  /** Whether to automatically trigger the download */
  autoDownload?: boolean;
  /** Custom MIME type for the download */
  mimeType?: string;
  /** Additional metadata to include */
  metadata?: Record<string, any>;
}

/**
 * Download result information
 */
export interface DownloadResult {
  /** Generated filename with extension */
  filename: string;
  /** File size in bytes */
  size: number;
  /** Download URL (object URL) */
  downloadUrl: string;
  /** MIME type of the file */
  mimeType: string;
  /** Timestamp when download was prepared */
  preparedAt: Date;
  /** Whether download was automatically triggered */
  autoTriggered: boolean;
}

/**
 * File information for download preparation
 */
export interface FileInfo {
  /** File blob */
  blob: Blob;
  /** Original filename (optional) */
  originalFilename?: string;
  /** File extension */
  extension: string;
  /** MIME type */
  mimeType: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Download service interface
 */
export interface DownloadService {
  /**
   * Prepare a file for download
   * 
   * @param fileInfo - Information about the file to download
   * @param options - Download options
   * @returns Download result with URL and metadata
   */
  prepareDownload(fileInfo: FileInfo, options?: DownloadOptions): DownloadResult;
  
  /**
   * Trigger a download for a prepared file
   * 
   * @param downloadResult - Result from prepareDownload
   * @returns Promise that resolves when download is triggered
   */
  triggerDownload(downloadResult: DownloadResult): Promise<void>;
  
  /**
   * Generate a meaningful filename based on content or options
   * 
   * @param originalName - Original filename or content identifier
   * @param extension - File extension (without dot)
   * @param options - Additional options for filename generation
   * @returns Generated filename
   */
  generateFilename(originalName?: string, extension?: string, options?: DownloadOptions): string;
  
  /**
   * Clean up download resources (revoke object URLs)
   * 
   * @param downloadResult - Download result to clean up
   */
  cleanupDownload(downloadResult: DownloadResult): void;
  
  /**
   * Check if downloads are supported in the current environment
   * 
   * @returns True if downloads are supported
   */
  isDownloadSupported(): boolean;
  
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
  };
  
  /**
   * Clean up all active download URLs
   */
  cleanupAllDownloads(): void;
}

/**
 * Custom error class for download errors
 */
export class DownloadError extends Error {
  public readonly code: string;
  public readonly details?: any;
  
  constructor(message: string, code: string = 'DOWNLOAD_ERROR', details?: any) {
    super(message);
    this.name = 'DownloadError';
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DownloadError);
    }
  }
}