import React, { useState, useCallback } from 'react';
import { useUpload, useUI } from '../../store/hooks';
import { ValidationService } from '../../services/validation';
import { ValidationErrorDisplay } from '../validation';
import './HtmlInput.css';

// Maximum content size in bytes (5MB)
const MAX_CONTENT_SIZE = 5 * 1024 * 1024;

interface HtmlInputProps {
  onContentAccepted: (content: string) => void;
  onError: (message: string) => void;
}

/**
 * HTML Content Input Component
 * 
 * This component provides a text area for direct HTML input.
 * It validates that the input is valid HTML content.
 * 
 * Requirements:
 * - 1.4: Allow direct HTML content input via text area
 * - 1.5: Validate and display a preview of the content
 */
const HtmlInput: React.FC<HtmlInputProps> = ({ onContentAccepted, onError }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const upload = useUpload();
  const ui = useUI();
  const validationService = new ValidationService();



  // Function to handle content submission
  const handleSubmit = useCallback(() => {
    upload.startUpload('direct');
    setValidationResult(null);
    
    try {
      // Validate HTML content
      const htmlValidation = validationService.validateHTML(htmlContent, { maxSize: MAX_CONTENT_SIZE });
      if (!htmlValidation.isValid) {
        setValidationResult(htmlValidation);
        upload.uploadError(htmlValidation.errors);
        onError(validationService.getValidationErrorMessage(htmlValidation));
        return;
      }
      
      // Show warnings if any
      if (htmlValidation.warnings.length > 0) {
        setValidationResult(htmlValidation);
        ui.addNotification('warning', 'Validation Warnings', `Content added with ${htmlValidation.warnings.length} warning(s)`);
      }
      
      // Calculate content size
      const contentSize = new Blob([htmlContent]).size;
      
      // Update state and notify parent
      upload.uploadSuccess(htmlContent, 'direct', undefined, contentSize);
      onContentAccepted(htmlContent);
      ui.addNotification('success', 'Content Added', 'HTML content added successfully');
    } catch (error) {
      const errorMessage = `Error processing content: ${error instanceof Error ? error.message : 'Unknown error'}`;
      upload.uploadError([errorMessage]);
      onError(errorMessage);
      ui.addNotification('error', 'Processing Failed', errorMessage);
    }
  }, [htmlContent, upload, ui, onContentAccepted, onError, validationService]);

  // Function to handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlContent(e.target.value);
    // Clear validation result when content changes
    if (validationResult) {
      setValidationResult(null);
    }
  };

  // Function to handle example insertion
  const insertExample = () => {
    const exampleHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Sample Presentation</title>
</head>
<body>
  <h1>Main Title</h1>
  <p>This is an example of HTML content that can be converted to a PowerPoint presentation.</p>
  
  <h2>Section 1</h2>
  <p>This will become a new slide in the presentation.</p>
  <ul>
    <li>Bullet point 1</li>
    <li>Bullet point 2</li>
    <li>Bullet point 3</li>
  </ul>
  
  <h2>Section 2</h2>
  <p>Another slide with different content.</p>
  <table border="1">
    <tr>
      <th>Header 1</th>
      <th>Header 2</th>
    </tr>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </table>
</body>
</html>`;
    
    setHtmlContent(exampleHtml);
  };

  return (
    <div className="html-input-container">
      <div className="textarea-container">
        <textarea
          className="html-textarea"
          value={htmlContent}
          onChange={handleContentChange}
          placeholder="Paste or type your HTML content here..."
          rows={10}
          data-testid="html-textarea"
          aria-label="HTML content input"
        />
      </div>
      
      <div className="html-input-actions">
        <button 
          type="button" 
          className="action-button secondary"
          onClick={insertExample}
          disabled={upload.isUploading}
        >
          Insert Example
        </button>
        <button 
          type="button" 
          className="action-button primary"
          onClick={handleSubmit}
          disabled={upload.isUploading || !htmlContent.trim()}
        >
          {upload.isUploading ? 'Processing...' : 'Use This HTML'}
        </button>
      </div>
      
      <div className="html-input-info">
        <p>Enter valid HTML content up to {MAX_CONTENT_SIZE / (1024 * 1024)}MB in size.</p>
        <p>The content should include HTML tags for proper conversion to PowerPoint.</p>
      </div>
      
      {validationResult && (
        <ValidationErrorDisplay 
          result={validationResult} 
          options={{ showWarnings: true, showSuggestions: true }}
        />
      )}
    </div>
  );
};

export default HtmlInput;