import React, { useEffect } from 'react';
import { useAppState, useAppStatus, useNotificationAutoDismiss } from '../store/hooks';
// Define AppPhase locally for compatibility
const AppPhase = {
  UPLOAD: 'upload',
  CONFIGURE: 'configure',
  PREVIEW: 'preview',
  VALIDATING: 'validating',
  CONVERTING: 'converting',
  COMPLETED: 'completed',
  ERROR: 'error'
} as const;
import FileUpload from './upload/FileUpload';
import HtmlInput from './upload/HtmlInput';
import ConfigContainer from './config/ConfigContainer';
import HtmlPreview from './preview/HtmlPreview';
import ConversionProgress from './progress/ConversionProgress';
import DownloadManager from './download/DownloadManager';
import { ConversionErrorRecovery } from './error/ConversionErrorRecovery';
import './AppContainer.css';

/**
 * Main Application Container Component
 * 
 * This component serves as the main container for the HTML to PPTX converter application.
 * It manages the overall application state and renders the appropriate components based
 * on the current phase of the conversion process.
 * 
 * Requirements:
 * - 5.1: Provide clear visual feedback on the current state of the process
 * - 5.3: Adapt the interface to different screen sizes
 */
const AppContainer: React.FC = () => {
  const { upload, configuration, preview, conversion, download, ui, transitions, validation, globalActions } = useAppState();
  const status = useAppStatus();
  
  // Auto-dismiss notifications
  useNotificationAutoDismiss();
  
  // Handle file upload success
  const handleFileUploadSuccess = (content: string) => {
    upload.setContent(content, 'file');
    validation.validateUpload(content);
    ui.setSuccessMessage('HTML file uploaded successfully!');
  };
  
  // Handle file upload error
  const handleFileUploadError = (message: string) => {
    upload.uploadError([message]);
    ui.setGlobalError(message);
  };
  
  // Handle HTML input success
  const handleHtmlInputSuccess = (content: string) => {
    upload.setContent(content, 'direct');
    validation.validateUpload(content);
    ui.setSuccessMessage('HTML content added successfully!');
  };
  
  // Handle HTML input error
  const handleHtmlInputError = (message: string) => {
    upload.uploadError([message]);
    ui.setGlobalError(message);
  };
  
  // Handle configuration changes
  const handleConfigChange = (config: any) => {
    configuration.updateConfig(config);
    validation.validateConfiguration({ ...configuration.config, ...config });
  };
  
  // Handle proceed to next step
  const handleProceedToNext = () => {
    if (transitions.canProceed) {
      transitions.proceedToNext();
    }
  };
  
  // Handle go back to previous step
  const handleGoBack = () => {
    if (transitions.canGoBack) {
      transitions.goBack();
    }
  };
  
  // Handle start conversion
  const handleStartConversion = () => {
    if (upload.htmlContent && validation.isValid) {
      const jobId = `conversion-${Date.now()}`;
      globalActions.startConversionWorkflow(jobId);
    }
  };
  
  // Handle start over
  const handleStartOver = () => {
    globalActions.startOver();
  };
  
  // Render phase-specific content
  const renderPhaseContent = () => {
    switch (ui.currentPhase) {
      case AppPhase.UPLOAD:
        return (
          <div className="upload-phase" role="region" aria-labelledby="upload-heading">
            <h2 id="upload-heading" className="sr-only">Upload HTML Content</h2>
            <div className="upload-options" role="group" aria-label="Choose how to provide HTML content">
              <div className="upload-option" role="region" aria-labelledby="file-upload-heading">
                <h3 id="file-upload-heading">Upload HTML File</h3>
                <FileUpload
                  onFileAccepted={handleFileUploadSuccess}
                  onError={handleFileUploadError}
                />
              </div>
              <div className="upload-divider" role="separator" aria-label="Alternative option">
                <span>OR</span>
              </div>
              <div className="upload-option" role="region" aria-labelledby="html-input-heading">
                <h3 id="html-input-heading">Enter HTML Content</h3>
                <HtmlInput
                  onContentAccepted={handleHtmlInputSuccess}
                  onError={handleHtmlInputError}
                />
              </div>
            </div>
          </div>
        );
        
      case AppPhase.CONFIGURE:
        return (
          <div className="configure-phase">
            <div className="configure-content">
              <div className="configure-main">
                <ConfigContainer
                  initialConfig={configuration.config}
                  onConfigChange={handleConfigChange}
                />
                <div className="configure-actions">
                  <button
                    className="action-button secondary"
                    onClick={handleGoBack}
                    disabled={!transitions.canGoBack}
                    aria-label="Go back to upload step"
                    type="button"
                  >
                    Back
                  </button>
                  <button
                    className="action-button primary"
                    onClick={handleProceedToNext}
                    disabled={!transitions.canProceed}
                    aria-label="Proceed to preview step"
                    type="button"
                  >
                    Preview
                  </button>
                </div>
              </div>
              <div className="configure-preview">
                {upload.htmlContent && (
                  <HtmlPreview
                    htmlContent={upload.htmlContent}
                    maxHeight={400}
                  />
                )}
              </div>
            </div>
          </div>
        );
        
      case AppPhase.PREVIEW:
        return (
          <div className="preview-phase" role="region" aria-labelledby="preview-heading">
            <div className="preview-content">
              <div className="preview-main">
                <h2 id="preview-heading">Preview Your Content</h2>
                <p>Review how your HTML content will be converted to slides:</p>
                {upload.htmlContent && (
                  <HtmlPreview
                    htmlContent={upload.htmlContent}
                    maxHeight={500}
                  />
                )}
                {preview.errors.length > 0 && (
                  <div className="preview-errors" role="alert" aria-labelledby="preview-errors-heading">
                    <h3 id="preview-errors-heading">Preview Issues:</h3>
                    <ul role="list">
                      {preview.errors.map((error: any, index: number) => (
                        <li key={index} role="listitem">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="preview-actions" role="group" aria-label="Preview actions">
                <button
                  className="action-button secondary"
                  onClick={handleGoBack}
                  disabled={!transitions.canGoBack}
                  aria-label="Go back to configuration step"
                  type="button"
                >
                  Back to Configuration
                </button>
                <button
                  className="action-button primary"
                  onClick={handleStartConversion}
                  disabled={!transitions.canProceed || preview.errors.length > 0}
                  aria-label={preview.errors.length > 0 ? "Cannot start conversion due to preview errors" : "Start converting HTML to PPTX"}
                  type="button"
                >
                  Start Conversion
                </button>
              </div>
            </div>
          </div>
        );
        
      case AppPhase.VALIDATING:
        return (
          <div className="validating-phase">
            <div className="validation-content">
              <h2>Validating Content</h2>
              <p>Please wait while we validate your content and configuration...</p>
              <div className="validation-progress">
                <div className="spinner"></div>
                <p>Validation in progress...</p>
              </div>
            </div>
          </div>
        );
        
      case AppPhase.CONVERTING:
        return (
          <div className="converting-phase">
            <ConversionProgress
              progress={conversion.progress}
              currentStep={conversion.currentStep}
              message={conversion.message}
              isActive={conversion.isConverting}
            />
          </div>
        );
        
      case AppPhase.COMPLETED:
        return (
          <div className="completed-phase">
            <div className="completion-message">
              <h2>Conversion Completed Successfully!</h2>
              <p>Your PowerPoint presentation is ready for download.</p>
            </div>
            <DownloadManager />
            <div className="completion-actions">
              <button
                className="action-button secondary"
                onClick={handleStartOver}
              >
                Convert Another File
              </button>
            </div>
          </div>
        );
        
      case AppPhase.ERROR:
        return (
          <div className="error-phase">
            {/* Show conversion error recovery if we have a conversion job ID */}
            {conversion.jobId && conversion.error ? (
              <ConversionErrorRecovery
                jobId={conversion.jobId}
                errorMessage={ui.globalError || conversion.error.message || 'An unexpected error occurred during conversion.'}
                visible={true}
                onRecoveryAttempt={(jobId, method) => {
                  ui.setSuccessMessage(`Attempting ${method} recovery for conversion...`);
                }}
                onRecoverySuccess={(newJobId) => {
                  // Update the job ID and restart the conversion process
                  globalActions.startConversionWorkflow(newJobId);
                  ui.setSuccessMessage('Recovery successful! Restarting conversion...');
                }}
                onRecoveryFailure={(error) => {
                  ui.setGlobalError(`Recovery failed: ${error}`);
                }}
                onDismiss={() => {
                  // Allow user to dismiss and try manual options
                  ui.setPhase(AppPhase.CONFIGURE);
                }}
                onProgress={(progress) => {
                  // Update conversion progress during recovery
                  conversion.updateProgress(progress.progress, progress.message, progress.currentStep, 0);
                }}
              />
            ) : (
              /* Fallback error display for non-conversion errors */
              <div className="error-fallback">
                <div className="error-message">
                  <h2>Error</h2>
                  <p>{ui.globalError || 'An unexpected error occurred.'}</p>
                  {conversion.error && (
                    <details className="error-details">
                      <summary>Technical Details</summary>
                      <pre>{JSON.stringify(conversion.error, null, 2)}</pre>
                    </details>
                  )}
                </div>
                <div className="error-actions">
                  <button
                    className="action-button secondary"
                    onClick={() => ui.setPhase(AppPhase.CONFIGURE)}
                  >
                    Try Again
                  </button>
                  <button
                    className="action-button primary"
                    onClick={handleStartOver}
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <div className="unknown-phase">
            <p>Unknown application state. Please refresh the page.</p>
            <button
              className="action-button primary"
              onClick={handleStartOver}
            >
              Reset Application
            </button>
          </div>
        );
    }
  };
  
  // Render notifications
  const renderNotifications = () => {
    if (ui.notifications.length === 0) return null;
    
    return (
      <div className="notifications-container" role="region" aria-label="Notifications" aria-live="polite">
        {ui.notifications.map((notification: any) => (
          <div
            key={notification.id}
            className={`notification notification-${notification.type}`}
            role={notification.type === 'error' ? 'alert' : 'status'}
            aria-labelledby={`notification-title-${notification.id}`}
            aria-describedby={`notification-message-${notification.id}`}
          >
            <div className="notification-content">
              <h4 id={`notification-title-${notification.id}`}>{notification.title}</h4>
              <p id={`notification-message-${notification.id}`}>{notification.message}</p>
            </div>
            <button
              className="notification-close"
              onClick={() => ui.removeNotification(notification.id)}
              aria-label={`Close ${notification.type} notification: ${notification.title}`}
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="app-container" role="application" aria-label="HTML to PPTX Converter Application">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="app-header" role="banner">
        <h1 id="app-title">HTML to PPTX Converter</h1>
        <div className="app-status" role="status" aria-live="polite" aria-label="Application status">
          <span 
            className={`status-indicator status-${ui.currentPhase}`}
            aria-label={`Current phase: ${ui.currentPhase.charAt(0).toUpperCase() + ui.currentPhase.slice(1)}`}
          >
            {ui.currentPhase.charAt(0).toUpperCase() + ui.currentPhase.slice(1)}
          </span>
          {status.isLoading && (
            <div className="loading-indicator" aria-label="Loading">
              <div className="spinner" role="progressbar" aria-label="Loading in progress"></div>
            </div>
          )}
        </div>
      </header>
      
      <main id="main-content" className="app-main" role="main" aria-labelledby="app-title">
        {renderPhaseContent()}
      </main>
      
      {renderNotifications()}
      
      {/* Global error message */}
      {ui.globalError && ui.currentPhase !== AppPhase.ERROR && (
        <div className="global-error" role="alert" aria-live="assertive">
          <div className="error-content">
            <span>{ui.globalError}</span>
            <button
              onClick={() => ui.setGlobalError(null)}
              aria-label="Dismiss error message"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Global success message */}
      {ui.successMessage && (
        <div className="global-success" role="status" aria-live="polite">
          <div className="success-content">
            <span>{ui.successMessage}</span>
            <button
              onClick={() => ui.setSuccessMessage(null)}
              aria-label="Dismiss success message"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppContainer;