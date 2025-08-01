import React, { useState, useCallback, useEffect } from 'react';
import { DownloadButton } from './DownloadButton';
import { DownloadService, DownloadResult, DownloadError } from '../../services/download';
import { DownloadErrorHandler } from '../../services/download/DownloadErrorHandler';
import './DownloadManager.css';

/**
 * Download Manager Component
 * 
 * This component manages the download process with progress tracking,
 * error handling, and retry functionality.
 * 
 * Requirements:
 * - 4.1: Provide a download button for the generated PPTX file
 * - 4.2: Implement download initiation
 * - 4.5: Create error detection for download failures and add retry functionality
 */

export interface DownloadManagerProps {
  /** PPTX blob to download */
  blob?: Blob;
  /** Original filename or identifier */
  originalName?: string;
  /** Custom filename for download */
  filename?: string;
  /** Whether downloads are enabled */
  enabled?: boolean;
  /** Show download statistics */
  showStats?: boolean;
  /** Auto-retry failed downloads */
  autoRetry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Custom CSS class */
  className?: string;
  /** Callback when download completes successfully */
  onSuccess?: (result: DownloadResult) => void;
  /** Callback when download fails */
  onError?: (error: DownloadError) => void;
}

interface DownloadAttempt {
  id: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'error' | 'retrying';
  error?: DownloadError;
  result?: DownloadResult;
  retryCount: number;
}

/**
 * DownloadManager Component
 * 
 * Manages PPTX downloads with error handling and retry functionality
 */
export const DownloadManager: React.FC<DownloadManagerProps> = ({
  blob,
  originalName,
  filename,
  enabled = true,
  showStats = false,
  autoRetry = true,
  maxRetries = 3,
  className = '',
  onSuccess,
  onError
}) => {
  const [downloadService] = useState(() => new DownloadService());
  const [errorHandler] = useState(() => new DownloadErrorHandler({
    retryConfig: { maxRetries: maxRetries },
    autoRetry: autoRetry
  }));
  const [downloadAttempts, setDownloadAttempts] = useState<DownloadAttempt[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<DownloadAttempt | null>(null);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);

  /**
   * Clean up retry timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryTimeout]);

  /**
   * Create a new download attempt
   */
  const createDownloadAttempt = useCallback((): DownloadAttempt => {
    return {
      id: `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0
    };
  }, []);

  /**
   * Update download attempt
   */
  const updateDownloadAttempt = useCallback((
    attemptId: string,
    updates: Partial<DownloadAttempt>
  ) => {
    setDownloadAttempts(prev => 
      prev.map(attempt => 
        attempt.id === attemptId 
          ? { ...attempt, ...updates }
          : attempt
      )
    );

    if (currentAttempt?.id === attemptId) {
      setCurrentAttempt(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [currentAttempt]);

  /**
   * Handle download start
   */
  const handleDownloadStart = useCallback(() => {
    const attempt = createDownloadAttempt();
    setCurrentAttempt(attempt);
    setDownloadAttempts(prev => [...prev, attempt]);
  }, [createDownloadAttempt]);

  /**
   * Handle download success
   */
  const handleDownloadSuccess = useCallback((result: DownloadResult) => {
    if (currentAttempt) {
      updateDownloadAttempt(currentAttempt.id, {
        status: 'success',
        result
      });
    }

    onSuccess?.(result);
    setCurrentAttempt(null);
  }, [currentAttempt, updateDownloadAttempt, onSuccess]);

  /**
   * Handle download error with retry logic
   */
  const handleDownloadError = useCallback(async (error: DownloadError) => {
    if (!currentAttempt) return;

    try {
      // Use the error handler to determine retry strategy
      const errorResult = await errorHandler.handleDownloadError(error, {
        filename: filename || originalName,
        fileSize: blob?.size,
        attemptNumber: currentAttempt.retryCount + 1,
        jobId: currentAttempt.id
      });

      if (errorResult.shouldRetry) {
        // Update attempt status to retrying
        updateDownloadAttempt(currentAttempt.id, {
          status: 'retrying',
          error,
          retryCount: errorResult.retryAttempt
        });

        // Schedule retry with calculated delay
        const timeout = setTimeout(() => {
          if (blob) {
            // Create new attempt for retry
            const retryAttempt = createDownloadAttempt();
            retryAttempt.retryCount = errorResult.retryAttempt;
            
            setCurrentAttempt(retryAttempt);
            setDownloadAttempts(prev => [...prev, retryAttempt]);
          }
        }, errorResult.retryDelay);

        setRetryTimeout(timeout);
      } else {
        // Final failure
        updateDownloadAttempt(currentAttempt.id, {
          status: 'error',
          error
        });

        // Create enhanced error with user-friendly message
        const enhancedError = new DownloadError(
          errorResult.userMessage,
          error.code,
          { originalError: error, conversionError: errorResult.conversionError }
        );

        onError?.(enhancedError);
        setCurrentAttempt(null);
      }
    } catch (handlerError) {
      // Fallback if error handler fails
      console.error('Error handler failed:', handlerError);
      
      updateDownloadAttempt(currentAttempt.id, {
        status: 'error',
        error
      });

      onError?.(error);
      setCurrentAttempt(null);
    }
  }, [
    currentAttempt,
    errorHandler,
    filename,
    originalName,
    blob,
    updateDownloadAttempt,
    createDownloadAttempt,
    onError
  ]);

  /**
   * Manual retry function
   */
  const retryDownload = useCallback(() => {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      setRetryTimeout(null);
    }

    const attempt = createDownloadAttempt();
    setCurrentAttempt(attempt);
    setDownloadAttempts(prev => [...prev, attempt]);
  }, [createDownloadAttempt, retryTimeout]);

  /**
   * Clear download history
   */
  const clearHistory = useCallback(() => {
    setDownloadAttempts([]);
    setCurrentAttempt(null);
    
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      setRetryTimeout(null);
    }
  }, [retryTimeout]);

  /**
   * Get download statistics
   */
  const getStats = useCallback(() => {
    const stats = downloadService.getDownloadStats();
    const attempts = downloadAttempts;
    
    return {
      ...stats,
      attempts: attempts.length,
      successful: attempts.filter(a => a.status === 'success').length,
      failed: attempts.filter(a => a.status === 'error').length,
      retrying: attempts.filter(a => a.status === 'retrying').length
    };
  }, [downloadService, downloadAttempts]);

  /**
   * Get current status message
   */
  const getStatusMessage = () => {
    if (!currentAttempt) return null;

    switch (currentAttempt.status) {
      case 'pending':
        return 'Preparing download...';
      case 'retrying':
        return `Retrying download (attempt ${currentAttempt.retryCount + 1}/${maxRetries + 1})...`;
      case 'error':
        return `Download failed: ${currentAttempt.error?.message || 'Unknown error'}`;
      case 'success':
        return 'Download completed successfully!';
      default:
        return null;
    }
  };

  /**
   * Check if download is available
   */
  const isDownloadAvailable = blob && blob.size > 0 && downloadService.isDownloadSupported();

  /**
   * Check if currently downloading or retrying
   */
  const isActive = currentAttempt && (currentAttempt.status === 'pending' || currentAttempt.status === 'retrying');

  /**
   * Check if last attempt failed and can be retried
   */
  const canRetry = currentAttempt?.status === 'error' && 
                   currentAttempt.retryCount < maxRetries;

  return (
    <div className={`download-manager ${className}`}>
      {/* Main Download Button */}
      <div className="download-controls">
        <DownloadButton
          blob={blob}
          originalName={originalName}
          filename={filename}
          disabled={!enabled || !isDownloadAvailable}
          variant="success"
          size="large"
          onDownloadStart={handleDownloadStart}
          onDownloadComplete={handleDownloadSuccess}
          onDownloadError={handleDownloadError}
        />

        {/* Retry Button */}
        {canRetry && (
          <button
            type="button"
            className="retry-button"
            onClick={retryDownload}
            title="Retry download"
          >
            ↻ Retry
          </button>
        )}

        {/* Clear History Button */}
        {downloadAttempts.length > 0 && (
          <button
            type="button"
            className="clear-button"
            onClick={clearHistory}
            title="Clear download history"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Status Message */}
      {getStatusMessage() && (
        <div className={`status-message ${currentAttempt?.status || ''}`}>
          {getStatusMessage()}
        </div>
      )}

      {/* Download Statistics */}
      {showStats && (
        <div className="download-stats">
          <h4>Download Statistics</h4>
          {(() => {
            const stats = getStats();
            return (
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Total Downloads:</span>
                  <span className="stat-value">{stats.totalDownloads}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Size:</span>
                  <span className="stat-value">{(stats.totalSize / 1024).toFixed(2)} KB</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Attempts:</span>
                  <span className="stat-value">{stats.attempts}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Successful:</span>
                  <span className="stat-value success">{stats.successful}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Failed:</span>
                  <span className="stat-value error">{stats.failed}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Active URLs:</span>
                  <span className="stat-value">{stats.activeUrls}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Download History */}
      {downloadAttempts.length > 0 && (
        <div className="download-history">
          <h4>Recent Downloads</h4>
          <div className="history-list">
            {downloadAttempts.slice(-5).reverse().map(attempt => (
              <div key={attempt.id} className={`history-item ${attempt.status}`}>
                <div className="history-time">
                  {attempt.timestamp.toLocaleTimeString()}
                </div>
                <div className="history-status">
                  {attempt.status === 'success' && '✓ Success'}
                  {attempt.status === 'error' && '✗ Failed'}
                  {attempt.status === 'pending' && '⟳ Downloading'}
                  {attempt.status === 'retrying' && `↻ Retry ${attempt.retryCount}`}
                </div>
                {attempt.error && (
                  <div className="history-error">
                    {attempt.error.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadManager;