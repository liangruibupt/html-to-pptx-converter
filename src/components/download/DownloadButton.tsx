import React, { useState, useCallback } from 'react';
import './DownloadButton.css';
import { DownloadService, DownloadResult, DownloadError } from '../../services/download';

/**
 * Download Button Component
 * 
 * This component provides a download button for PPTX files with progress indication
 * and error handling.
 * 
 * Requirements:
 * - 4.1: Provide a download button for the generated PPTX file
 * - 4.2: Implement download initiation
 */

export interface DownloadButtonProps {
  /** PPTX blob to download */
  blob?: Blob;
  /** Original filename or identifier */
  originalName?: string;
  /** Custom filename for download */
  filename?: string;
  /** Button text */
  children?: React.ReactNode;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'success' | 'outline';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Custom CSS class */
  className?: string;
  /** Show download icon */
  showIcon?: boolean;
  /** Callback when download starts */
  onDownloadStart?: () => void;
  /** Callback when download completes */
  onDownloadComplete?: (result: DownloadResult) => void;
  /** Callback when download fails */
  onDownloadError?: (error: DownloadError) => void;
  /** Auto-cleanup download URL after download */
  autoCleanup?: boolean;
}

/**
 * DownloadButton Component
 * 
 * Provides a button to download PPTX files with built-in error handling
 */
export const DownloadButton: React.FC<DownloadButtonProps> = ({
  blob,
  originalName,
  filename,
  children = 'Download PPTX',
  disabled = false,
  variant = 'primary',
  size = 'medium',
  className = '',
  showIcon = true,
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
  autoCleanup = true
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadService] = useState(() => new DownloadService());

  /**
   * Handle download button click
   */
  const handleDownload = useCallback(async () => {
    if (!blob || isDownloading || disabled) {
      return;
    }

    try {
      setIsDownloading(true);
      onDownloadStart?.();

      // Prepare download
      const downloadResult = downloadService.downloadPptx(blob, originalName, {
        filename,
        autoDownload: false // We'll trigger manually for better control
      });

      // Trigger download
      await downloadService.triggerDownload(downloadResult);

      // Notify completion
      onDownloadComplete?.(downloadResult);

      // Auto-cleanup if enabled
      if (autoCleanup) {
        setTimeout(() => {
          downloadService.cleanupDownload(downloadResult);
        }, 1000);
      }

    } catch (error) {
      const downloadError = error instanceof DownloadError 
        ? error 
        : new DownloadError(`Download failed: ${error instanceof Error ? error.message : String(error)}`);
      
      onDownloadError?.(downloadError);
      console.error('Download failed:', downloadError);
    } finally {
      setIsDownloading(false);
    }
  }, [
    blob,
    originalName,
    filename,
    isDownloading,
    disabled,
    downloadService,
    onDownloadStart,
    onDownloadComplete,
    onDownloadError,
    autoCleanup
  ]);

  /**
   * Get download icon based on state
   */
  const getIcon = () => {
    if (!showIcon) return null;

    if (isDownloading) {
      return (
        <span className="download-icon downloading" aria-hidden="true">
          ⟳
        </span>
      );
    }

    return (
      <span className="download-icon" aria-hidden="true">
        ⬇
      </span>
    );
  };

  /**
   * Check if download is available
   */
  const isDownloadAvailable = blob && blob.size > 0 && downloadService.isDownloadSupported();

  return (
    <button
      type="button"
      className={`download-button ${variant} ${size} ${className} ${isDownloading ? 'downloading' : ''}`}
      onClick={handleDownload}
      disabled={disabled || isDownloading || !isDownloadAvailable}
      aria-label={isDownloading ? 'Downloading...' : 'Download PPTX file'}
      title={
        !isDownloadAvailable 
          ? 'Download not available' 
          : isDownloading 
            ? 'Downloading...' 
            : 'Click to download PPTX file'
      }
    >
      {getIcon()}
      <span className="download-text">
        {isDownloading ? 'Downloading...' : children}
      </span>
    </button>
  );
};

export default DownloadButton;