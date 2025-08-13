import React, { useEffect } from 'react';
import { useAppState, useAppStatus, useNotificationAutoDismiss } from '../store/hooks';
import { AppPhase } from '../store/types';
import FileUpload from './upload/FileUpload';
import HtmlInput from './upload/HtmlInput';
import ConfigContainer from './config/ConfigContainer';
import HtmlPreview from './preview/HtmlPreview';
import ConversionProgress from './progress/ConversionProgress';
import DownloadManager from './download/DownloadManager';
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
          <div className="upload-phase">
            <div className="upload-options">
              <div className="upload-option">
                <h3>Upload HTML File</h3>
                <FileUpload
                  onFileAccepted={handleFileUploadSuccess}
                  onError={handleFileUploadError}
                />
              </div>
              <div className="upload-divider">
                <span>OR</span>
              </div>
              <div className="upload-option">
                <h3>Enter HTML Content</h3>
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
                  >
                    Back
                  </button>
                  <button
                    className="action-button primary"
                    onClick={handleProceedToNext}
                    disabled={!transitions.canProceed}
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
          <div className="preview-phase">
            <div className="preview-content">
              <div className="preview-main">
                <h2>Preview Your Content</h2>
                <p>Review how your HTML content will be converted to slides:</p>
                {upload.htmlContent && (
                  <HtmlPreview
                    htmlContent={upload.htmlContent}
                    maxHeight={500}
                  />
                )}
                {preview.errors.length > 0 && (
                  <div className="preview-errors">
                    <h3>Preview Issues:</h3>
                    <ul>
                      {preview.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="preview-actions">
                <button
                  className="action-button secondary"
                  onClick={handleGoBack}
                  disabled={!transitions.canGoBack}
                >
                  Back to Configuration
                </button>
                <button
                  className="action-button primary"
                  onClick={handleStartConversion}
                  disabled={!transitions.canProceed || preview.errors.length > 0}
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
            <div className="error-message">
              <h2>Conversion Error</h2>
              <p>{ui.globalError || 'An unexpected error occurred during conversion.'}</p>
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
      <div className="notifications-container">
        {ui.notifications.map(notification => (
          <div
            key={notification.id}
            className={`notification notification-${notification.type}`}
          >
            <div className="notification-content">
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
            </div>
            <button
              className="notification-close"
              onClick={() => ui.removeNotification(notification.id)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>HTML to PPTX Converter</h1>
        <div className="app-status">
          <span className={`status-indicator status-${ui.currentPhase}`}>
            {ui.currentPhase.charAt(0).toUpperCase() + ui.currentPhase.slice(1)}
          </span>
          {status.isLoading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      </header>
      
      <main className="app-main">
        {renderPhaseContent()}
      </main>
      
      {renderNotifications()}
      
      {/* Global error message */}
      {ui.globalError && ui.currentPhase !== AppPhase.ERROR && (
        <div className="global-error">
          <div className="error-content">
            <span>{ui.globalError}</span>
            <button
              onClick={() => ui.setGlobalError(null)}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Global success message */}
      {ui.successMessage && (
        <div className="global-success">
          <div className="success-content">
            <span>{ui.successMessage}</span>
            <button
              onClick={() => ui.setSuccessMessage(null)}
              aria-label="Dismiss success message"
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