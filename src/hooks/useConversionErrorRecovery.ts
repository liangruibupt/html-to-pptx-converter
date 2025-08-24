import { useState, useCallback, useEffect } from 'react';
import { 
  conversionErrorRecoveryService, 
  RecoveryOption, 
  RecoveryResult 
} from '../services/conversion/ConversionErrorRecovery';

/**
 * Hook for managing conversion error recovery
 * 
 * This hook provides a convenient interface for handling conversion errors
 * and applying recovery options.
 * 
 * Requirements:
 * - 3.7: Provide meaningful error messages for conversion errors
 * - 3.8: Handle conversion errors gracefully and continue the process when possible
 */

export interface ConversionErrorRecoveryState {
  /** Whether recovery options are being loaded */
  isLoading: boolean;
  /** Available recovery options */
  recoveryOptions: RecoveryOption[];
  /** Whether automatic recovery is available */
  autoRecoveryAvailable: boolean;
  /** Recovery suggestions */
  suggestions: string[];
  /** Whether the error can be recovered */
  canRecover: boolean;
  /** Current recovery attempt in progress */
  isRecovering: boolean;
  /** Last recovery result */
  lastRecoveryResult: RecoveryResult | null;
  /** Error message if recovery options couldn't be loaded */
  error: string | null;
}

export interface UseConversionErrorRecoveryReturn extends ConversionErrorRecoveryState {
  /** Load recovery options for a job */
  loadRecoveryOptions: (jobId: string) => void;
  /** Attempt automatic recovery */
  attemptAutoRecovery: (jobId: string, progressCallback?: (progress: any) => void) => Promise<RecoveryResult>;
  /** Apply manual recovery options */
  applyManualRecovery: (jobId: string, options: { [key: string]: any }, progressCallback?: (progress: any) => void) => Promise<RecoveryResult>;
  /** Get guided recovery steps */
  getGuidedRecovery: (jobId: string) => {
    steps: Array<{
      step: number;
      title: string;
      description: string;
      action: string;
      required: boolean;
    }>;
    estimatedSuccessRate: number;
    error?: string;
  };
  /** Reset recovery state */
  resetRecovery: () => void;
  /** Get recovery history for a job */
  getRecoveryHistory: (jobId: string) => RecoveryResult[];
  /** Get recovery statistics */
  getRecoveryStatistics: () => {
    totalRecoveryAttempts: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    autoRecoverySuccessRate: number;
    manualRecoverySuccessRate: number;
    mostCommonRecoveryActions: Array<{ action: string; count: number }>;
  };
}

/**
 * Custom hook for conversion error recovery
 */
export const useConversionErrorRecovery = (): UseConversionErrorRecoveryReturn => {
  const [state, setState] = useState<ConversionErrorRecoveryState>({
    isLoading: false,
    recoveryOptions: [],
    autoRecoveryAvailable: false,
    suggestions: [],
    canRecover: false,
    isRecovering: false,
    lastRecoveryResult: null,
    error: null
  });

  /**
   * Load recovery options for a specific job
   */
  const loadRecoveryOptions = useCallback((jobId: string) => {
    setState(prevState => ({
      ...prevState,
      isLoading: true,
      error: null
    }));

    try {
      const options = conversionErrorRecoveryService.getRecoveryOptions(jobId);
      
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        recoveryOptions: options.options,
        autoRecoveryAvailable: options.autoRecoveryAvailable,
        suggestions: options.suggestions,
        canRecover: options.canRecover,
        error: options.error || null
      }));
    } catch (error: any) {
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        error: error.message,
        canRecover: false,
        recoveryOptions: [],
        autoRecoveryAvailable: false,
        suggestions: []
      }));
    }
  }, []);

  /**
   * Attempt automatic recovery
   */
  const attemptAutoRecovery = useCallback(async (
    jobId: string, 
    progressCallback?: (progress: any) => void
  ): Promise<RecoveryResult> => {
    setState(prevState => ({
      ...prevState,
      isRecovering: true,
      error: null
    }));

    try {
      const result = await conversionErrorRecoveryService.attemptAutoRecovery(jobId, progressCallback);
      
      setState(prevState => ({
        ...prevState,
        isRecovering: false,
        lastRecoveryResult: result
      }));

      return result;
    } catch (error: any) {
      const failedResult: RecoveryResult = {
        success: false,
        error: error.message,
        method: 'automatic'
      };

      setState(prevState => ({
        ...prevState,
        isRecovering: false,
        lastRecoveryResult: failedResult,
        error: error.message
      }));

      return failedResult;
    }
  }, []);

  /**
   * Apply manual recovery options
   */
  const applyManualRecovery = useCallback(async (
    jobId: string, 
    options: { [key: string]: any }, 
    progressCallback?: (progress: any) => void
  ): Promise<RecoveryResult> => {
    setState(prevState => ({
      ...prevState,
      isRecovering: true,
      error: null
    }));

    try {
      const result = await conversionErrorRecoveryService.applyManualRecovery(
        jobId, 
        options, 
        progressCallback
      );
      
      setState(prevState => ({
        ...prevState,
        isRecovering: false,
        lastRecoveryResult: result
      }));

      return result;
    } catch (error: any) {
      const failedResult: RecoveryResult = {
        success: false,
        error: error.message,
        method: 'manual'
      };

      setState(prevState => ({
        ...prevState,
        isRecovering: false,
        lastRecoveryResult: failedResult,
        error: error.message
      }));

      return failedResult;
    }
  }, []);

  /**
   * Get guided recovery steps
   */
  const getGuidedRecovery = useCallback((jobId: string) => {
    return conversionErrorRecoveryService.getGuidedRecovery(jobId);
  }, []);

  /**
   * Reset recovery state
   */
  const resetRecovery = useCallback(() => {
    setState({
      isLoading: false,
      recoveryOptions: [],
      autoRecoveryAvailable: false,
      suggestions: [],
      canRecover: false,
      isRecovering: false,
      lastRecoveryResult: null,
      error: null
    });
  }, []);

  /**
   * Get recovery history for a job
   */
  const getRecoveryHistory = useCallback((jobId: string) => {
    return conversionErrorRecoveryService.getRecoveryHistory(jobId);
  }, []);

  /**
   * Get recovery statistics
   */
  const getRecoveryStatistics = useCallback(() => {
    return conversionErrorRecoveryService.getRecoveryStatistics();
  }, []);

  return {
    ...state,
    loadRecoveryOptions,
    attemptAutoRecovery,
    applyManualRecovery,
    getGuidedRecovery,
    resetRecovery,
    getRecoveryHistory,
    getRecoveryStatistics
  };
};