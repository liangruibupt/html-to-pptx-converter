import { useState, useEffect } from 'react';
import './styles/App.css';
import FileUpload from './components/upload/FileUpload';
import HtmlInput from './components/upload/HtmlInput';
import HtmlPreview from './components/preview/HtmlPreview';

/**
 * Main Application Container Component
 * 
 * This component serves as the main container for the HTML to PPTX converter application.
 * It provides the overall layout structure and responsive design for the application.
 * 
 * Requirements:
 * - 5.1: Clear visual feedback on the current state of the process
 * - 5.3: Responsive design for different screen sizes
 */
const App: React.FC = () => {
  // Track the current active step in the conversion process
  const [activeStep, setActiveStep] = useState<number>(0);
  
  // Track screen size for responsive design
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  
  // Steps in the conversion process
  const steps = [
    'Upload HTML',
    'Configure',
    'Convert',
    'Download'
  ];

  // Effect to handle responsive design based on screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Function to handle step navigation
  const navigateToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setActiveStep(stepIndex);
    }
  };

  // State for HTML content and error messages
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'direct'>('file');

  // Handle HTML content acceptance (from either file upload or direct input)
  const handleContentAccepted = (content: string) => {
    setHtmlContent(content);
    setErrorMessage(null);
    // Automatically move to the next step when content is successfully provided
    navigateToStep(1);
  };

  // Handle error (from either file upload or direct input)
  const handleError = (message: string) => {
    setErrorMessage(message);
    setHtmlContent(null);
  };
  
  // We'll use the setUploadMethod directly in the buttons instead of this function

  // Render the appropriate content based on the active step
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <section className="app-section">
            <h2>Upload HTML Content</h2>
            <p>Upload an HTML file or paste HTML code to convert it to a PowerPoint presentation.</p>
            
            <div className="upload-method-toggle">
              <button 
                className={`toggle-button ${uploadMethod === 'file' ? 'active' : ''}`}
                onClick={() => setUploadMethod('file')}
                aria-pressed={uploadMethod === 'file'}
              >
                Upload File
              </button>
              <button 
                className={`toggle-button ${uploadMethod === 'direct' ? 'active' : ''}`}
                onClick={() => setUploadMethod('direct')}
                aria-pressed={uploadMethod === 'direct'}
              >
                Paste HTML
              </button>
            </div>
            
            {uploadMethod === 'file' ? (
              /* File Upload Component */
              <FileUpload 
                onFileAccepted={handleContentAccepted}
                onError={handleError}
              />
            ) : (
              /* HTML Input Component */
              <HtmlInput 
                onContentAccepted={handleContentAccepted}
                onError={handleError}
              />
            )}
            
            {/* Error message display */}
            {errorMessage && (
              <div className="error-message" role="alert">
                <p>{errorMessage}</p>
              </div>
            )}
            
            {/* HTML Preview */}
            {htmlContent && (
              <HtmlPreview htmlContent={htmlContent} maxHeight={400} />
            )}
          </section>
        );
      case 1:
        return (
          <section className="app-section">
            <h2>Configure Conversion Settings</h2>
            <p>Customize how your HTML content will be converted to slides.</p>
            
            {/* Placeholder for the configuration component */}
            <div className="placeholder-component">
              <p>Configuration Component will be implemented here</p>
            </div>
          </section>
        );
      case 2:
        return (
          <section className="app-section">
            <h2>Convert HTML to PPTX</h2>
            <p>Review your content and start the conversion process.</p>
            
            {/* Placeholder for the conversion component */}
            <div className="placeholder-component">
              <p>Conversion Component will be implemented here</p>
            </div>
          </section>
        );
      case 3:
        return (
          <section className="app-section">
            <h2>Download Your Presentation</h2>
            <p>Your HTML content has been converted to a PowerPoint presentation.</p>
            
            {/* Placeholder for the download component */}
            <div className="placeholder-component">
              <p>Download Component will be implemented here</p>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  // Render progress indicator for mobile view
  const renderMobileProgress = () => {
    return (
      <div className="mobile-progress">
        <p className="current-step">Step {activeStep + 1} of {steps.length}: {steps[activeStep]}</p>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Determine container class based on screen size
  const containerClass = `app-container ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''} ${isDesktop ? 'desktop' : ''}`;

  return (
    <div className={containerClass}>
      <header className="app-header">
        <div className="header-content">
          <h1>HTML to PPTX Converter</h1>
          <p>Transform HTML content into PowerPoint presentations</p>
        </div>
      </header>
      
      <nav className="app-navigation">
        {isMobile ? (
          renderMobileProgress()
        ) : (
          <ul className="steps-indicator">
            {steps.map((step, index) => (
              <li 
                key={index} 
                className={`step ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'completed' : ''}`}
                onClick={() => navigateToStep(index)}
                role="button"
                tabIndex={0}
                aria-label={`Go to step ${index + 1}: ${step}`}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigateToStep(index);
                  }
                }}
              >
                <span className="step-number">{index + 1}</span>
                <span className="step-label">{step}</span>
              </li>
            ))}
          </ul>
        )}
      </nav>
      
      <main className="app-main">
        <div className="content-container">
          {renderStepContent()}
        </div>
      </main>
      
      <div className="app-actions">
        <div className="actions-container">
          <button 
            className="action-button secondary"
            onClick={() => navigateToStep(activeStep - 1)}
            disabled={activeStep === 0}
            aria-label="Go to previous step"
          >
            Previous
          </button>
          <button 
            className="action-button primary"
            onClick={() => navigateToStep(activeStep + 1)}
            disabled={activeStep === steps.length - 1}
            aria-label={activeStep === steps.length - 2 ? "Finish conversion" : "Go to next step"}
          >
            {activeStep === steps.length - 2 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
      
      <footer className="app-footer">
        <div className="footer-content">
          <p>HTML to PPTX Converter - Built with React, TypeScript, and PptxGenJS</p>
          <div className="footer-links">
            <a href="#help" aria-label="Help documentation">Help</a>
            <a href="#about" aria-label="About this application">About</a>
            <a href="#privacy" aria-label="Privacy policy">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;