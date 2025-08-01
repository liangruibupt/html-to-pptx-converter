import React from 'react';
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
  /** Current progress percentage (0-100) */
  progress: number;
  /** Current conversion status */
  status: 'idle' | 'started' | 'processing' | 'completed' | 'error' | 'cancelled';
  /** Current step being processed */
  currentStep: string;
  /** Progress message */
  message: string;
  /** List of all conversion steps */
  steps?: string[];
  /** Current step index */
  currentStepIndex?: number;
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
  progress,
  status,
  currentStep,
  message,
  steps = [
    'Parsing HTML content',
    'Extracting content structure', 
    'Creating slide structure',
    'Formatting slide content',
    'Generating PPTX file',
    'Finalizing conversion'
  ],
  currentStepIndex = 0,
  showSteps = true,
  animated = true,
  className = '',
  onCancel,
  showCancel = false
}) => {
  // Determine the progress bar color based on status
  const getProgressColor = () => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'cancelled':
        return 'warning';
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
      case 'cancelled':
        return '⚠';
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
      case 'cancelled':
        return 'Conversion cancelled';
      default:
        return '';
    }
  };

  // Calculate step progress
  const getStepProgress = (stepIndex: number) => {
    if (status === 'completed') return 100;
    if (status === 'error' || status === 'cancelled') return stepIndex < currentStepIndex ? 100 : 0;
    
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
    <div className={`conversion-progress ${className} ${status}`}>
      {/* Main Progress Bar */}
      <div className="progress-header">
        <div className="progress-status">
          <span className={`status-icon ${status}`}>
            {getStatusIcon()}
          </span>
          <span className="status-text">{getStatusText()}</span>
        </div>
        
        {showCancel && onCancel && (status === 'processing' || status === 'started') && (
          <button 
            className="cancel-button"
            onClick={onCancel}
            aria-label="Cancel conversion"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className={`progress-fill ${getProgressColor()} ${animated ? 'animated' : ''}`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Conversion progress: ${progress}%`}
          />
        </div>
        <div className="progress-percentage">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Current Step Message */}
      <div className="progress-message">
        {message || currentStep}
      </div>

      {/* Detailed Steps */}
      {showSteps && (
        <div className="progress-steps">
          {steps.map((step, index) => {
            const stepProgress = getStepProgress(index);
            const isActive = index === currentStepIndex;
            const isCompleted = stepProgress === 100;
            const isFailed = status === 'error' && index === currentStepIndex;
            
            return (
              <div 
                key={index}
                className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isFailed ? 'failed' : ''}`}
              >
                <div className="step-indicator">
                  <div className="step-number">
                    {isCompleted ? '✓' : isFailed ? '✗' : index + 1}
                  </div>
                  <div 
                    className="step-progress-bar"
                    style={{ width: `${stepProgress}%` }}
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