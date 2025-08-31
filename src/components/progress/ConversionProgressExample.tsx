import React, { useState } from 'react';
import { ConversionProgress } from './ConversionProgress';
import { useConversionProgress } from '../../hooks/useConversionProgress';

/**
 * Example component demonstrating the ConversionProgress component
 * 
 * This component shows how to integrate the progress indicator with
 * the conversion process and handle user interactions.
 */
export const ConversionProgressExample: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState(`
    <html>
      <body>
        <h1>Sample HTML Content</h1>
        <p>This is a sample HTML document that will be converted to PPTX.</p>
        <h2>Features</h2>
        <ul>
          <li>Text formatting</li>
          <li>Images</li>
          <li>Tables</li>
          <li>Lists</li>
        </ul>
      </body>
    </html>
  `);

  const [conversionOptions, setConversionOptions] = useState({
    theme: 'DEFAULT',
    slideLayout: 'WIDE',
    includeImages: true,
    preserveLinks: true
  });

  const {
    progress,
    status,
    currentStep,
    message,
    currentStepIndex,
    error,
    result,
    startConversion,
    cancelConversion,
    retryConversion,
    resetProgress,
    isConverting,
    canCancel,
    canRetry
  } = useConversionProgress();

  const handleStartConversion = async () => {
    if (htmlContent.trim()) {
      await startConversion(htmlContent, conversionOptions);
    }
  };

  const handleDownload = () => {
    if (result && result.downloadUrl) {
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.filename || 'presentation.pptx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>HTML to PPTX Converter - Progress Demo</h1>
      
      {/* HTML Input */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="html-input" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          HTML Content:
        </label>
        <textarea
          id="html-input"
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          style={{
            width: '100%',
            height: '200px',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
          disabled={isConverting}
        />
      </div>

      {/* Conversion Options */}
      <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Theme:</label>
          <select
            value={conversionOptions.theme}
            onChange={(e) => setConversionOptions(prev => ({ ...prev, theme: e.target.value }))}
            disabled={isConverting}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="DEFAULT">Default</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="CREATIVE">Creative</option>
            <option value="MINIMAL">Minimal</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Layout:</label>
          <select
            value={conversionOptions.slideLayout}
            onChange={(e) => setConversionOptions(prev => ({ ...prev, slideLayout: e.target.value }))}
            disabled={isConverting}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="STANDARD">Standard (4:3)</option>
            <option value="WIDE">Wide (16:9)</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={conversionOptions.includeImages}
              onChange={(e) => setConversionOptions(prev => ({ ...prev, includeImages: e.target.checked }))}
              disabled={isConverting}
            />
            <span style={{ fontWeight: 'bold' }}>Include Images</span>
          </label>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={conversionOptions.preserveLinks}
              onChange={(e) => setConversionOptions(prev => ({ ...prev, preserveLinks: e.target.checked }))}
              disabled={isConverting}
            />
            <span style={{ fontWeight: 'bold' }}>Preserve Links</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={handleStartConversion}
          disabled={isConverting || !htmlContent.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: isConverting || !htmlContent.trim() ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConverting || !htmlContent.trim() ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isConverting ? 'Converting...' : 'Start Conversion'}
        </button>

        {canRetry && (
          <button
            onClick={retryConversion}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Retry Conversion
          </button>
        )}

        {status === 'completed' && result && (
          <button
            onClick={handleDownload}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Download PPTX
          </button>
        )}

        {(status === 'completed' || status === 'error' || status === 'cancelled') && (
          <button
            onClick={resetProgress}
            style={{
              padding: '12px 24px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Progress Indicator */}
      {status !== 'idle' && (
        <ConversionProgress
          progress={progress}
          currentStep={currentStep}
          message={message}
          isActive={isConverting}
          showSteps={true}
          animated={true}
          showCancel={canCancel}
          onCancel={cancelConversion}
        />
      )}

      {/* Result Information */}
      {result && status === 'completed' && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          backgroundColor: '#e8f5e8', 
          borderRadius: '4px',
          border: '1px solid #4caf50'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#2e7d32' }}>Conversion Completed!</h3>
          <p><strong>File:</strong> {result.filename}</p>
          <p><strong>Size:</strong> {(result.size / 1024).toFixed(2)} KB</p>
          <p><strong>Slides:</strong> {result.slideCount}</p>
          <p><strong>Format:</strong> {result.format.toUpperCase()}</p>
        </div>
      )}

      {/* Error Information */}
      {error && status === 'error' && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          backgroundColor: '#ffebee', 
          borderRadius: '4px',
          border: '1px solid #f44336'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#c62828' }}>Conversion Failed</h3>
          <p><strong>Error:</strong> {error.message || 'Unknown error occurred'}</p>
          {error.suggestions && error.suggestions.length > 0 && (
            <div>
              <strong>Suggestions:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                {error.suggestions.map((suggestion: string, index: number) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversionProgressExample;