import React, { useState, useEffect } from 'react';
import { useConversionErrorRecovery } from '../../hooks/useConversionErrorRecovery';
import { RecoveryOption } from '../../services/conversion/ConversionErrorRecovery';
import './ConversionErrorRecovery.css';

/**
 * Conversion Error Recovery Component
 * 
 * This component displays conversion errors and provides recovery options to users.
 * 
 * Requirements:
 * - 3.7: Provide meaningful error messages for conversion errors
 * - 3.8: Handle conversion errors gracefully and continue the process when possible
 */

export interface ConversionErrorRecoveryProps {
  /** Job ID that encountered an error */
  jobId: string;
  /** Error message to display */
  errorMessage: string;
  /** Whether to show the component */
  visible: boolean;
  /** Callback when recovery is attempted */
  onRecoveryAttempt?: (jobId: string, method: 'auto' | 'manual') => void;
  /** Callback when recovery succeeds */
  onRecoverySuccess?: (newJobId: string) => void;
  /** Callback when recovery fails */
  onRecoveryFailure?: (error: string) => void;
  /** Callback when user dismisses the error */
  onDismiss?: () => void;
  /** Progress callback for recovery operations */
  onProgress?: (progress: any) => void;
}

export const ConversionErrorRecovery: React.FC<ConversionErrorRecoveryProps> = ({
  jobId,
  errorMessage,
  visible,
  onRecoveryAttempt,
  onRecoverySuccess,
  onRecoveryFailure,
  onDismiss,
  onProgress
}) => {
  const {
    isLoading,
    recoveryOptions,
    autoRecoveryAvailable,
    suggestions,
    canRecover,
    isRecovering,
    lastRecoveryResult,
    error,
    loadRecoveryOptions,
    attemptAutoRecovery,
    applyManualRecovery,
    getGuidedRecovery,
    resetRecovery
  } = useConversionErrorRecovery();

  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: any }>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [guidedSteps, setGuidedSteps] = useState<any>(null);

  // Load recovery options when component becomes visible
  useEffect(() => {
    if (visible && jobId) {
      loadRecoveryOptions(jobId);
    }
  }, [visible, jobId, loadRecoveryOptions]);

  // Handle recovery result
  useEffect(() => {
    if (lastRecoveryResult) {
      if (lastRecoveryResult.success && lastRecoveryResult.newJobId) {
        onRecoverySuccess?.(lastRecoveryResult.newJobId);
      } else if (!lastRecoveryResult.success && lastRecoveryResult.error) {
        onRecoveryFailure?.(lastRecoveryResult.error);
      }
    }
  }, [lastRecoveryResult, onRecoverySuccess, onRecoveryFailure]);

  const handleAutoRecovery = async () => {
    if (!jobId) return;
    
    onRecoveryAttempt?.(jobId, 'auto');
    
    try {
      await attemptAutoRecovery(jobId, onProgress);
    } catch (error: any) {
      onRecoveryFailure?.(error.message);
    }
  };

  const handleManualRecovery = async () => {
    if (!jobId) return;
    
    onRecoveryAttempt?.(jobId, 'manual');
    
    try {
      await applyManualRecovery(jobId, selectedOptions, onProgress);
    } catch (error: any) {
      onRecoveryFailure?.(error.message);
    }
  };

  const handleOptionChange = (optionId: string, value: any) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: value
    }));
  };

  const handleShowGuidedRecovery = () => {
    if (jobId) {
      const guided = getGuidedRecovery(jobId);
      setGuidedSteps(guided);
    }
  };

  const handleDismiss = () => {
    resetRecovery();
    onDismiss?.();
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="conversion-error-recovery" role="dialog" aria-labelledby="error-recovery-heading" aria-modal="true">
      <div className="error-recovery-header">
        <h3 id="error-recovery-heading">Conversion Error</h3>
        <button 
          className="dismiss-button"
          onClick={handleDismiss}
          aria-label="Dismiss error recovery dialog"
          type="button"
        >
          ×
        </button>
      </div>

      <div className="error-message" role="alert" aria-describedby="error-description">
        <div className="error-icon" aria-hidden="true">⚠️</div>
        <div className="error-text">
          <p id="error-description">{errorMessage}</p>
          {error && (
            <p className="recovery-error" role="alert">
              Recovery Error: {error}
            </p>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="loading-recovery">
          <div className="spinner"></div>
          <p>Analyzing error and finding recovery options...</p>
        </div>
      )}

      {!isLoading && canRecover && (
        <div className="recovery-options">
          <h4>Recovery Options</h4>
          
          {suggestions.length > 0 && (
            <div className="suggestions">
              <h5>Suggestions:</h5>
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {autoRecoveryAvailable && (
            <div className="auto-recovery">
              <h5>Automatic Recovery</h5>
              <p>We can try to automatically fix this issue for you.</p>
              <button
                className="recovery-button auto-recovery-button"
                onClick={handleAutoRecovery}
                disabled={isRecovering}
                aria-label={isRecovering ? 'Auto recovery in progress' : 'Start automatic error recovery'}
                type="button"
              >
                {isRecovering ? 'Attempting Recovery...' : 'Try Auto Recovery'}
              </button>
            </div>
          )}

          {recoveryOptions.length > 0 && (
            <div className="manual-recovery">
              <h5>Manual Recovery Options</h5>
              <p>Choose specific recovery options to apply:</p>
              
              <div className="recovery-option-list">
                {recoveryOptions.map((option) => (
                  <div key={option.id} className="recovery-option">
                    <label className="recovery-option-label">
                      <input
                        type="checkbox"
                        checked={selectedOptions[option.action] || false}
                        onChange={(e) => handleOptionChange(option.action, e.target.checked)}
                      />
                      <div className="option-content">
                        <div className="option-title">{option.title}</div>
                        <div className="option-description">{option.description}</div>
                        <div className="option-impact">Impact: {option.impact}</div>
                        {option.successRate && (
                          <div className="option-success-rate">
                            Success Rate: {Math.round(option.successRate * 100)}%
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <button
                className="recovery-button manual-recovery-button"
                onClick={handleManualRecovery}
                disabled={isRecovering || Object.keys(selectedOptions).length === 0}
              >
                {isRecovering ? 'Applying Recovery...' : 'Apply Selected Options'}
              </button>
            </div>
          )}

          <div className="advanced-options">
            <button
              className="toggle-advanced"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>

            {showAdvanced && (
              <div className="advanced-content">
                <button
                  className="guided-recovery-button"
                  onClick={handleShowGuidedRecovery}
                >
                  Get Guided Recovery Steps
                </button>

                {guidedSteps && (
                  <div className="guided-steps">
                    <h6>Guided Recovery Steps</h6>
                    <p>Estimated Success Rate: {Math.round(guidedSteps.estimatedSuccessRate * 100)}%</p>
                    <ol>
                      {guidedSteps.steps.map((step: any) => (
                        <li key={step.step} className={step.required ? 'required-step' : 'optional-step'}>
                          <strong>{step.title}</strong>
                          <p>{step.description}</p>
                          {step.required && <span className="required-badge">Required</span>}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoading && !canRecover && (
        <div className="no-recovery">
          <h4>Recovery Not Possible</h4>
          <p>This error cannot be automatically recovered. Please check your input and try again.</p>
          <div className="manual-suggestions">
            <h5>What you can try:</h5>
            <ul>
              <li>Check that your HTML content is valid and well-formed</li>
              <li>Try using simpler HTML content</li>
              <li>Reduce the size of your content</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
        </div>
      )}

      {lastRecoveryResult && (
        <div className={`recovery-result ${lastRecoveryResult.success ? 'success' : 'failure'}`}>
          {lastRecoveryResult.success ? (
            <div className="success-message">
              <div className="success-icon">✅</div>
              <p>Recovery successful! A new conversion has been started.</p>
            </div>
          ) : (
            <div className="failure-message">
              <div className="failure-icon">❌</div>
              <p>Recovery failed: {lastRecoveryResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};