/**
 * Conversion Error Recovery Service
 * 
 * This service provides comprehensive error recovery functionality for conversion errors.
 * It works with the ConversionOrchestrator to provide recovery options and automatic recovery.
 * 
 * Requirements:
 * - 3.7: Provide meaningful error messages for conversion errors
 * - 3.8: Handle conversion errors gracefully and continue the process when possible
 */

import { ConversionError, ErrorCategory, ErrorSeverity } from '../error/ErrorHandlerInterface';
import { conversionOrchestrator } from '../ConversionOrchestrator.js';

/**
 * Recovery option interface
 */
export interface RecoveryOption {
  /** Unique identifier for the recovery option */
  id: string;
  /** Human-readable title */
  title: string;
  /** Detailed description of what this option does */
  description: string;
  /** The action to perform */
  action: string;
  /** Whether this can be applied automatically */
  automatic: boolean;
  /** Impact description for the user */
  impact: string;
  /** Fallback values if applicable */
  fallbackTheme?: string;
  fallbackLayout?: string;
  fallbackSplitStrategy?: string;
  /** Estimated success rate (0-1) */
  successRate?: number;
}

/**
 * Recovery result interface
 */
export interface RecoveryResult {
  /** Whether recovery was successful */
  success: boolean;
  /** New job ID if recovery started a new conversion */
  newJobId?: string;
  /** Recovery options that were applied */
  appliedOptions?: RecoveryOption[];
  /** Error message if recovery failed */
  error?: string;
  /** Recovery method used */
  method: 'automatic' | 'manual' | 'guided';
}

/**
 * Recovery strategy interface
 */
export interface RecoveryStrategy {
  /** Strategy name */
  name: string;
  /** Error categories this strategy applies to */
  categories: ErrorCategory[];
  /** Error patterns this strategy can handle */
  patterns: RegExp[];
  /** Recovery options provided by this strategy */
  options: RecoveryOption[];
  /** Whether this strategy supports automatic recovery */
  supportsAutoRecovery: boolean;
}

/**
 * Conversion Error Recovery Service
 */
export class ConversionErrorRecoveryService {
  private recoveryStrategies: RecoveryStrategy[] = [];
  private recoveryHistory: Map<string, RecoveryResult[]> = new Map();

  constructor() {
    this.initializeRecoveryStrategies();
  }

  /**
   * Get recovery options for a conversion error
   * 
   * @param jobId - The job ID with the error
   * @returns Recovery options and suggestions
   */
  getRecoveryOptions(jobId: string): {
    canRecover: boolean;
    autoRecoveryAvailable: boolean;
    options: RecoveryOption[];
    suggestions: string[];
    error?: string;
  } {
    try {
      const result = conversionOrchestrator.getRecoveryOptions(jobId);
      
      if (result.error) {
        return {
          canRecover: false,
          autoRecoveryAvailable: false,
          options: [],
          suggestions: [],
          error: result.error
        };
      }

      return result;
    } catch (error: any) {
      return {
        canRecover: false,
        autoRecoveryAvailable: false,
        options: [],
        suggestions: [],
        error: error.message
      };
    }
  }

  /**
   * Attempt automatic recovery for a conversion error
   * 
   * @param jobId - The job ID to recover
   * @param progressCallback - Optional progress callback
   * @returns Recovery result
   */
  async attemptAutoRecovery(jobId: string, progressCallback?: (progress: any) => void): Promise<RecoveryResult> {
    try {
      const result = await conversionOrchestrator.attemptAutoRecovery(jobId, progressCallback);
      
      const recoveryResult: RecoveryResult = {
        success: true,
        newJobId: result.jobId,
        method: 'automatic'
      };

      // Store recovery history
      this.addToRecoveryHistory(jobId, recoveryResult);

      return recoveryResult;
    } catch (error: any) {
      const recoveryResult: RecoveryResult = {
        success: false,
        error: error.message,
        method: 'automatic'
      };

      this.addToRecoveryHistory(jobId, recoveryResult);
      return recoveryResult;
    }
  }

  /**
   * Apply manual recovery options
   * 
   * @param jobId - The job ID to recover
   * @param recoveryOptions - Recovery options to apply
   * @param progressCallback - Optional progress callback
   * @returns Recovery result
   */
  async applyManualRecovery(
    jobId: string, 
    recoveryOptions: { [key: string]: any }, 
    progressCallback?: (progress: any) => void
  ): Promise<RecoveryResult> {
    try {
      const result = await conversionOrchestrator.retryConversionWithRecovery(
        jobId, 
        recoveryOptions, 
        progressCallback
      );
      
      const recoveryResult: RecoveryResult = {
        success: true,
        newJobId: result.jobId,
        method: 'manual'
      };

      this.addToRecoveryHistory(jobId, recoveryResult);
      return recoveryResult;
    } catch (error: any) {
      const recoveryResult: RecoveryResult = {
        success: false,
        error: error.message,
        method: 'manual'
      };

      this.addToRecoveryHistory(jobId, recoveryResult);
      return recoveryResult;
    }
  }

  /**
   * Get guided recovery suggestions based on error analysis
   * 
   * @param jobId - The job ID with the error
   * @returns Guided recovery suggestions
   */
  getGuidedRecovery(jobId: string): {
    steps: Array<{
      step: number;
      title: string;
      description: string;
      action: string;
      required: boolean;
    }>;
    estimatedSuccessRate: number;
    error?: string;
  } {
    try {
      const recoveryOptions = this.getRecoveryOptions(jobId);
      
      if (!recoveryOptions.canRecover) {
        return {
          steps: [],
          estimatedSuccessRate: 0,
          error: recoveryOptions.error || 'Recovery not possible'
        };
      }

      // Generate guided recovery steps
      const steps = this.generateGuidedSteps(recoveryOptions.options);
      const successRate = this.estimateSuccessRate(recoveryOptions.options);

      return {
        steps,
        estimatedSuccessRate: successRate
      };
    } catch (error: any) {
      return {
        steps: [],
        estimatedSuccessRate: 0,
        error: error.message
      };
    }
  }

  /**
   * Get recovery history for a job
   * 
   * @param jobId - The job ID
   * @returns Recovery history
   */
  getRecoveryHistory(jobId: string): RecoveryResult[] {
    return this.recoveryHistory.get(jobId) || [];
  }

  /**
   * Check if a job can be recovered
   * 
   * @param jobId - The job ID
   * @returns Whether the job can be recovered
   */
  canRecover(jobId: string): boolean {
    const options = this.getRecoveryOptions(jobId);
    return options.canRecover;
  }

  /**
   * Get recovery statistics
   * 
   * @returns Recovery statistics
   */
  getRecoveryStatistics(): {
    totalRecoveryAttempts: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    autoRecoverySuccessRate: number;
    manualRecoverySuccessRate: number;
    mostCommonRecoveryActions: Array<{ action: string; count: number }>;
  } {
    let totalAttempts = 0;
    let successful = 0;
    let autoSuccessful = 0;
    let autoTotal = 0;
    let manualSuccessful = 0;
    let manualTotal = 0;
    const actionCounts: { [key: string]: number } = {};

    for (const history of this.recoveryHistory.values()) {
      for (const result of history) {
        totalAttempts++;
        
        if (result.success) {
          successful++;
          
          if (result.method === 'automatic') {
            autoSuccessful++;
          } else if (result.method === 'manual') {
            manualSuccessful++;
          }
        }

        if (result.method === 'automatic') {
          autoTotal++;
        } else if (result.method === 'manual') {
          manualTotal++;
        }

        // Count applied options
        if (result.appliedOptions) {
          for (const option of result.appliedOptions) {
            actionCounts[option.action] = (actionCounts[option.action] || 0) + 1;
          }
        }
      }
    }

    const mostCommonActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRecoveryAttempts: totalAttempts,
      successfulRecoveries: successful,
      failedRecoveries: totalAttempts - successful,
      autoRecoverySuccessRate: autoTotal > 0 ? autoSuccessful / autoTotal : 0,
      manualRecoverySuccessRate: manualTotal > 0 ? manualSuccessful / manualTotal : 0,
      mostCommonRecoveryActions: mostCommonActions
    };
  }

  /**
   * Clear recovery history
   */
  clearRecoveryHistory(): void {
    this.recoveryHistory.clear();
  }

  /**
   * Initialize recovery strategies
   * @private
   */
  private initializeRecoveryStrategies(): void {
    this.recoveryStrategies = [
      {
        name: 'HTML Parsing Recovery',
        categories: [ErrorCategory.PARSING],
        patterns: [/parsing/i, /html/i, /malformed/i],
        supportsAutoRecovery: true,
        options: [
          {
            id: 'simplify_html',
            title: 'Simplify HTML Structure',
            description: 'Remove complex HTML elements that may be causing parsing issues',
            action: 'simplifyContent',
            automatic: false,
            impact: 'Some formatting and complex elements may be lost',
            successRate: 0.7
          },
          {
            id: 'change_split_strategy',
            title: 'Use Simple Section Splitting',
            description: 'Switch to basic heading-based section splitting',
            action: 'changeSplitStrategy',
            automatic: true,
            impact: 'Content organization may change',
            fallbackSplitStrategy: 'BY_H1',
            successRate: 0.9
          }
        ]
      },
      {
        name: 'PPTX Generation Recovery',
        categories: [ErrorCategory.GENERATION],
        patterns: [/generation/i, /pptx/i, /memory/i, /size/i],
        supportsAutoRecovery: true,
        options: [
          {
            id: 'reduce_complexity',
            title: 'Reduce Content Complexity',
            description: 'Disable images and complex formatting to reduce generation load',
            action: 'reduceComplexity',
            automatic: true,
            impact: 'Images and advanced formatting will be removed',
            successRate: 0.8
          },
          {
            id: 'use_default_theme',
            title: 'Use Default Theme',
            description: 'Switch to the most stable default theme',
            action: 'changeTheme',
            automatic: true,
            impact: 'Presentation will use default styling',
            fallbackTheme: 'DEFAULT',
            successRate: 0.85
          },
          {
            id: 'use_standard_layout',
            title: 'Use Standard Layout',
            description: 'Switch to standard slide layout for better compatibility',
            action: 'changeLayout',
            automatic: true,
            impact: 'Slides will use standard 4:3 layout',
            fallbackLayout: 'STANDARD',
            successRate: 0.9
          }
        ]
      },
      {
        name: 'Conversion Recovery',
        categories: [ErrorCategory.CONVERSION],
        patterns: [/conversion/i, /slide/i, /create/i],
        supportsAutoRecovery: true,
        options: [
          {
            id: 'compatibility_mode',
            title: 'Enable Compatibility Mode',
            description: 'Use the most compatible settings for conversion',
            action: 'useCompatibilityMode',
            automatic: true,
            impact: 'All advanced features will be disabled',
            successRate: 0.95
          },
          {
            id: 'split_large_content',
            title: 'Split Large Content',
            description: 'Break large sections into smaller slides',
            action: 'splitLargeContent',
            automatic: false,
            impact: 'Content may be split across more slides',
            successRate: 0.75
          }
        ]
      },
      {
        name: 'Validation Recovery',
        categories: [ErrorCategory.VALIDATION],
        patterns: [/validation/i, /invalid/i, /required/i],
        supportsAutoRecovery: true,
        options: [
          {
            id: 'fix_validation_issues',
            title: 'Fix Validation Issues',
            description: 'Automatically correct common validation problems',
            action: 'fixValidation',
            automatic: true,
            impact: 'Some content may be modified to meet requirements',
            successRate: 0.9
          }
        ]
      }
    ];
  }

  /**
   * Generate guided recovery steps
   * @private
   */
  private generateGuidedSteps(options: RecoveryOption[]): Array<{
    step: number;
    title: string;
    description: string;
    action: string;
    required: boolean;
  }> {
    const steps: Array<{
      step: number;
      title: string;
      description: string;
      action: string;
      required: boolean;
    }> = [];

    // Sort options by success rate (highest first)
    const sortedOptions = [...options].sort((a, b) => (b.successRate || 0) - (a.successRate || 0));

    sortedOptions.forEach((option, index) => {
      steps.push({
        step: index + 1,
        title: option.title,
        description: option.description,
        action: option.action,
        required: option.automatic || (option.successRate || 0) > 0.8
      });
    });

    return steps;
  }

  /**
   * Estimate success rate for recovery options
   * @private
   */
  private estimateSuccessRate(options: RecoveryOption[]): number {
    if (options.length === 0) {
      return 0;
    }

    // Calculate weighted average success rate
    const totalWeight = options.reduce((sum, option) => sum + (option.successRate || 0.5), 0);
    const weightedSum = options.reduce((sum, option) => {
      const rate = option.successRate || 0.5;
      return sum + (rate * rate); // Square to give higher weight to higher success rates
    }, 0);

    return Math.min(weightedSum / totalWeight, 1);
  }

  /**
   * Add recovery result to history
   * @private
   */
  private addToRecoveryHistory(jobId: string, result: RecoveryResult): void {
    if (!this.recoveryHistory.has(jobId)) {
      this.recoveryHistory.set(jobId, []);
    }
    
    const history = this.recoveryHistory.get(jobId)!;
    history.push(result);
    
    // Keep only the last 10 recovery attempts per job
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
  }
}

// Export singleton instance
export const conversionErrorRecoveryService = new ConversionErrorRecoveryService();