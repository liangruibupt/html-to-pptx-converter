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
  status?: ConversionStatus;
  progress?: number;
  currentStep?: string;
  message?: string;
  error?: string;
}

export interface ConversionStartResponse {
  jobId: string;
  status: ConversionStatus;
}

export interface ConversionResultResponse {
  status: ConversionStatus;
  result?: any;
}

export interface ConversionErrorResponse {
  error: any;
  userMessage?: string;
}

export interface ConversionCancelResponse {
  status: ConversionStatus;
}

export interface UseConversionProgressReturn extends ConversionProgressState {
  /** Start a new conversion */
  startConversion: (htmlContent: string, options?: any) => Promise<void>;
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
  const lastConversionRef = useRef<{ htmlContent: string; options?: any } | null>(null);
  
  // Polling interval for checking conversion status
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Progress callback function for the orchestrator
   */
  const progressCallback = useCallback((progressInfo: any) => {
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
      
      if (status.error) {
        // Job not found or other error
        setState(prevState => ({
          ...prevState,
          status: 'error',
          error: { message: status.error },
          message: status.error || 'Unknown error occurred'
        }));
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        return;
      }

      setState(prevState => ({
        ...prevState,
        progress: status.progress || 0,
        status: status.status || 'processing',
        currentStep: status.currentStep || '',
        message: status.message || '',
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
          if (result.status === 'completed') {
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
            error: errorInfo.error,
            status: 'error',
            message: errorInfo.userMessage || 'Conversion failed'
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
  const startConversion = useCallback(async (htmlContent: string, options: any = {}) => {
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
      
      if (result.status === 'cancelled') {
        setState(prevState => ({
          ...prevState,
          status: 'cancelled',
          message: 'Conversion cancelled by user'
        }));
      }

      // Stop polling
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