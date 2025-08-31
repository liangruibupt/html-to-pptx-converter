import { useState, useEffect, useCallback, useRef } from 'react';
import { conversionOrchestrator } from '../services/ConversionOrchestrator.js';

/**
 * Hook for managing conversion progress state
 * 
 * This hook provides a convenient interface for tracking conversion progress
 * and integrating with the ConversionOrchestrator service.
 * 
 * Requirements:
 * - 5.2: Display a progress indicator during conversion
 */

export type ConversionStatus = 'idle' | 'started' | 'processing' | 'completed' | 'error' | 'cancelled';

export interface ConversionProgressState {
  /** Current progress percentage (0-100) */
  progress: number;
  /** Current conversion status */
  status: ConversionStatus;
  /** Current step being processed */
  currentStep: string;
  /** Progress message */
  message: string;
  /** Current step index */
  currentStepIndex: number;
  /** Job ID for the current conversion */
  jobId: string | null;
  /** Error information if conversion failed */
  error: any | null;
  /** Conversion result if completed */
  result: any | null;
}

export interface ConversionStatusResponse {
  jobId?: string;
  status?: ConversionStatus | 'not_found';
  progress?: number;
  currentStep?: string;
  startTime?: Date;
  error?: string;
  result?: any;
}

export interface ConversionStartResponse {
  jobId: string;
  status: ConversionStatus;
  message: string;
  options: any;
}

export interface ConversionResultResponse {
  jobId?: string;
  status: ConversionStatus;
  result?: any;
  error?: any;
  progress?: number;
}

export interface ConversionErrorResponse {
  jobId?: string;
  status?: ConversionStatus | 'not_found';
  error?: any;
  userMessage?: string;
  suggestions?: string[];
  recoveryOptions?: any;
}

export interface ProgressInfo {
  progress?: number;
  status?: ConversionStatus;
  currentStep?: string;
  message?: string;
}

export interface ConversionCancelResponse {
  jobId?: string;
  status: ConversionStatus | 'not_found';
  message?: string;
  error?: string;
}

export interface ConversionOptions {
  slideLayout?: string;
  includeImages?: boolean;
  imageOptions?: any;
  theme?: string;
  splitSections?: string;
  customSectionSelector?: string;
  preserveLinks?: boolean;
  customStyles?: Record<string, any>;
}

export interface UseConversionProgressReturn extends ConversionProgressState {
  /** Start a new conversion */
  startConversion: (htmlContent: string, options?: ConversionOptions) => Promise<void>;
  /** Cancel the current conversion */
  cancelConversion: () => void;
  /** Retry a failed conversion */
  retryConversion: () => Promise<void>;
  /** Reset the progress state */
  resetProgress: () => void;
  /** Check if conversion is in progress */
  isConverting: boolean;
  /** Check if conversion can be cancelled */
  canCancel: boolean;
  /** Check if conversion can be retried */
  canRetry: boolean;
}

/**
 * Custom hook for managing conversion progress
 */
export const useConversionProgress = (): UseConversionProgressReturn => {
  const [state, setState] = useState<ConversionProgressState>({
    progress: 0,
    status: 'idle',
    currentStep: '',
    message: '',
    currentStepIndex: 0,
    jobId: null,
    error: null,
    result: null
  });

  // Store the last conversion parameters for retry functionality
  const lastConversionRef = useRef<{ htmlContent: string; options?: ConversionOptions } | null>(null);
  
  // Polling interval for checking conversion status
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Progress callback function for the orchestrator
   */
  const progressCallback = useCallback((progressInfo: ProgressInfo) => {
    setState(prevState => ({
      ...prevState,
      progress: progressInfo.progress || 0,
      status: progressInfo.status || 'processing',
      currentStep: progressInfo.currentStep || '',
      message: progressInfo.message || '',
      currentStepIndex: Math.floor((progressInfo.progress || 0) / 16.67) // Approximate step index based on progress
    }));
  }, []);

  /**
   * Poll for conversion status updates
   */
  const pollConversionStatus = useCallback((jobId: string) => {
    const poll = () => {
      const status = conversionOrchestrator.getConversionStatus(jobId) as ConversionStatusResponse;
      
      // Handle job not found or other errors
      if (status.error || status.status === 'not_found') {
        setState(prevState => ({
          ...prevState,
          status: 'error',
          error: { message: status.error || 'Job not found' },
          message: status.error || 'Job not found'
        }));
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        return;
      }

      // Update state with current status
      setState(prevState => ({
        ...prevState,
        progress: status.progress || 0,
        status: (status.status as ConversionStatus) || 'processing',
        currentStep: status.currentStep || '',
        message: status.currentStep || '',
        currentStepIndex: Math.floor((status.progress || 0) / 16.67)
      }));

      // Stop polling if conversion is complete or failed
      if (status.status === 'completed' || status.status === 'error' || status.status === 'cancelled') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        // Get final result if completed
        if (status.status === 'completed') {
          const result = conversionOrchestrator.getConversionResult(jobId) as ConversionResultResponse;
          if (result.status === 'completed' && result.result) {
            setState(prevState => ({
              ...prevState,
              result: result.result,
              status: 'completed',
              progress: 100,
              message: 'Conversion completed successfully!'
            }));
          }
        } else if (status.status === 'error') {
          // Get error details
          const errorInfo = conversionOrchestrator.getConversionError(jobId) as ConversionErrorResponse;
          setState(prevState => ({
            ...prevState,
            error: errorInfo.error || status.error,
            status: 'error',
            message: errorInfo.userMessage || 'Conversion failed'
          }));
        } else if (status.status === 'cancelled') {
          setState(prevState => ({
            ...prevState,
            status: 'cancelled',
            message: 'Conversion was cancelled'
          }));
        }
      }
    };

    // Start polling
    pollingIntervalRef.current = setInterval(poll, 500); // Poll every 500ms
    poll(); // Initial poll
  }, []);

  /**
   * Start a new conversion
   */
  const startConversion = useCallback(async (htmlContent: string, options: ConversionOptions = {}) => {
    try {
      // Reset state
      setState({
        progress: 0,
        status: 'started',
        currentStep: 'Starting conversion...',
        message: 'Initializing conversion process...',
        currentStepIndex: 0,
        jobId: null,
        error: null,
        result: null
      });

      // Store conversion parameters for retry
      lastConversionRef.current = { htmlContent, options };

      // Start conversion with progress callback
      const result = await conversionOrchestrator.startConversion(
        htmlContent,
        options,
        progressCallback
      ) as ConversionStartResponse;

      // Update state with job ID
      setState(prevState => ({
        ...prevState,
        jobId: result.jobId,
        status: 'processing',
        message: 'Conversion started...'
      }));

      // Start polling for status updates
      pollConversionStatus(result.jobId);

    } catch (error: any) {
      setState(prevState => ({
        ...prevState,
        status: 'error',
        error: error,
        message: error.message || 'Failed to start conversion'
      }));
    }
  }, [progressCallback, pollConversionStatus]);

  /**
   * Cancel the current conversion
   */
  const cancelConversion = useCallback(() => {
    if (state.jobId && (state.status === 'processing' || state.status === 'started')) {
      const result = conversionOrchestrator.cancelConversion(state.jobId) as ConversionCancelResponse;
      
      // Handle successful cancellation
      if (result.status === 'cancelled') {
        setState(prevState => ({
          ...prevState,
          status: 'cancelled',
          message: result.message || 'Conversion cancelled by user'
        }));
      } else if (result.error) {
        // Handle cancellation errors (e.g., job not found, already completed)
        setState(prevState => ({
          ...prevState,
          status: 'error',
          error: { message: result.error },
          message: result.error || 'Cancellation failed'
        }));
      }

      // Stop polling regardless of result
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [state.jobId, state.status]);

  /**
   * Retry a failed conversion
   */
  const retryConversion = useCallback(async () => {
    if (lastConversionRef.current && (state.status === 'error' || state.status === 'cancelled')) {
      await startConversion(
        lastConversionRef.current.htmlContent,
        lastConversionRef.current.options
      );
    }
  }, [state.status, startConversion]);

  /**
   * Reset the progress state
   */
  const resetProgress = useCallback(() => {
    // Stop polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    setState({
      progress: 0,
      status: 'idle',
      currentStep: '',
      message: '',
      currentStepIndex: 0,
      jobId: null,
      error: null,
      result: null
    });

    lastConversionRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Computed properties
  const isConverting = state.status === 'processing' || state.status === 'started';
  const canCancel = isConverting && state.jobId !== null;
  const canRetry = (state.status === 'error' || state.status === 'cancelled') && 
                   lastConversionRef.current !== null;

  return {
    ...state,
    startConversion,
    cancelConversion,
    retryConversion,
    resetProgress,
    isConverting,
    canCancel,
    canRetry
  };
};