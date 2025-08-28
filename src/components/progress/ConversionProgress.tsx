import React, { useEffect } from 'react';
import { useConversion, useUI } from '../../store/hooks';
import { useProgressAnnouncement } from '../../hooks/useAccessibility';
import './ConversionProgress.css';

/**
 * Conversion Progress Component
 * 
 * This component displays the progress of the HTML to PPTX conversion process
 * with visual feedback and step completion indicators.
 * 
 * Requirements:
 * - 5.2: Display a progress indicator during conversion
 */

export interface ConversionProgressProps {
  /** Current progress percentage (0-100) - optional, will use state if not provided */
  progress?: number;
  /** Current step being processed - optional, will use state if not provided */
  currentStep?: string;
  /** Progress message - optional, will use state if not provided */
  message?: string;
  /** Whether conversion is active - optional, will use state if not provided */
  isActive?: boolean;
  /** List of all conversion steps */
  steps?: string[];
  /** Whether to show detailed step information */
  showSteps?: boolean;
  /** Whether the progress bar should be animated */
  animated?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Callback when cancel button is clicked */
  onCancel?: () => void;
  /** Whether to show cancel button */
  showCancel?: boolean;
}

/**
 * ConversionProgress Component
 * 
 * Displays a visual progress indicator for the conversion process
 */
export const ConversionProgress: React.FC<ConversionProgressProps> = ({
  progress: propProgress,
  currentStep: propCurrentStep,
  message: propMessage,
  isActive: propIsActive,
  steps = [
    'Parsing HTML content',
    'Extracting content structure', 
    'Creating slide structure',
    'Formatting slide content',
    'Generating PPTX file',
    'Finalizing conversion'
  ],
  showSteps = true,
  animated = true,
  className = '',
  onCancel,
  showCancel = false
}) => {
  const conversion = useConversion();
  const ui = useUI();
  const { announce, announceCompletion, announceError } = useProgressAnnouncement();
  
  // Use props if provided, otherwise use state
  const progress = propProgress !== undefined ? propProgress : conversion.progress;
  const currentStep = propCurrentStep || conversion.currentStep;
  const message = propMessage || conversion.message;
  const isActive = propIsActive !== undefined ? propIsActive : conversion.isConverting;
  const currentStepIndex = conversion.currentStepIndex;
  
  // Determine status based on conversion state
  const getStatus = (): 'idle' | 'started' | 'processing' | 'completed' | 'error' => {
    if (conversion.error) return 'error';
    if (conversion.result && !conversion.isConverting) return 'completed';
    if (conversion.isConverting) return 'processing';
    if (conversion.jobId && !conversion.isConverting) return 'started';
    return 'idle';
  };
  
  const status = getStatus();
  
  // Announce progress changes to screen readers
  useEffect(() => {
    if (isActive && currentStep && progress > 0) {
      announce(currentStep, progress);
    }
  }, [currentStep, progress, isActive, announce]);
  
  // Announce completion or error
  useEffect(() => {
    if (status === 'completed') {
      announceCompletion('Conversion completed successfully');
    } else if (status === 'error' && message) {
      announceError(message);
    }
  }, [status, message, announceCompletion, announceError]);
  // Determine the progress bar color based on status
  const getProgressColor = () => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'processing':
      case 'started':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'error':
        return '✗';
      case 'processing':
      case 'started':
        return '⟳';
      default:
        return '';
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready to convert';
      case 'started':
        return 'Starting conversion...';
      case 'processing':
        return 'Converting...';
      case 'completed':
        return 'Conversion completed!';
      case 'error':
        return 'Conversion failed';
      default:
        return '';
    }
  };

  // Calculate step progress
  const getStepProgress = (stepIndex: number) => {
    if (status === 'completed') return 100;
    if (status === 'error') return stepIndex < currentStepIndex ? 100 : 0;
    
    if (stepIndex < currentStepIndex) return 100;
    if (stepIndex === currentStepIndex) {
      // Calculate progress within current step
      const stepSize = 100 / steps.length;
      const stepProgress = progress - (stepIndex * stepSize);
      return Math.max(0, Math.min(100, (stepProgress / stepSize) * 100));
    }
    return 0;
  };

  return (
    <div className={`conversion-progress ${className} ${status}`} role="region" aria-labelledby="conversion-progress-heading">
      {/* Main Progress Bar */}
      <div className="progress-header">
        <div className="progress-status">
          <span className={`status-icon ${status}`} aria-hidden="true">
            {getStatusIcon()}
          </span>
          <span id="conversion-progress-heading" className="status-text">{getStatusText()}</span>
        </div>
        
        {showCancel && onCancel && (status === 'processing' || status === 'started') && (
          <button 
            className="cancel-button"
            onClick={onCancel}
            aria-label="Cancel the current conversion process"
            type="button"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar" role="presentation">
          <div 
            className={`progress-fill ${getProgressColor()} ${animated ? 'animated' : ''}`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Conversion progress: ${Math.round(progress)} percent complete`}
            aria-describedby="progress-message"
          />
        </div>
        <div className="progress-percentage" aria-hidden="true">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Current Step Message */}
      <div id="progress-message" className="progress-message" role="status" aria-live="polite">
        {message || currentStep}
      </div>

      {/* Detailed Steps */}
      {showSteps && (
        <div className="progress-steps" role="list" aria-label="Conversion steps">
          {steps.map((step, index) => {
            const stepProgress = getStepProgress(index);
            const isActive = index === currentStepIndex;
            const isCompleted = stepProgress === 100;
            const isFailed = status === 'error' && index === currentStepIndex;
            
            return (
              <div 
                key={index}
                className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isFailed ? 'failed' : ''}`}
                role="listitem"
                aria-label={`Step ${index + 1}: ${step}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className="step-indicator" role="presentation">
                  <div 
                    className="step-number"
                    aria-label={
                      isCompleted ? `Step ${index + 1} completed` :
                      isFailed ? `Step ${index + 1} failed` :
                      `Step ${index + 1}`
                    }
                  >
                    {isCompleted ? '✓' : isFailed ? '✗' : index + 1}
                  </div>
                  <div 
                    className="step-progress-bar"
                    style={{ width: `${stepProgress}%` }}
                    role="progressbar"
                    aria-valuenow={stepProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Step ${index + 1} progress: ${stepProgress}%`}
                  />
                </div>
                <div className="step-label">
                  {step}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Message (if any) */}
      {status === 'error' && (
        <div className="error-message" role="alert">
          <strong>Error:</strong> {message}
        </div>
      )}

      {/* Success Message */}
      {status === 'completed' && (
        <div className="success-message" role="status">
          <strong>Success:</strong> Your presentation has been generated successfully!
        </div>
      )}
    </div>
  );
};

export default ConversionProgress;