import React, { useState, useCallback } from 'react';
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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Function to validate HTML content
  const validateHTML = (content: string): boolean => {
    // Basic validation - check if content contains HTML tags
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);
    
    // Check for basic HTML structure
    const hasHtmlStructure = /<html[\s\S]*>[\s\S]*<\/html>/i.test(content) || 
                            /<body[\s\S]*>[\s\S]*<\/body>/i.test(content);
    
    return hasHtmlTags || hasHtmlStructure;
  };

  // Function to handle content submission
  const handleSubmit = useCallback(() => {
    setIsProcessing(true);
    
    try {
      // Check if content is empty
      if (!htmlContent.trim()) {
        onError('Please enter HTML content');
        setIsProcessing(false);
        return;
      }
      
      // Check content size
      const contentSize = new Blob([htmlContent]).size;
      if (contentSize > MAX_CONTENT_SIZE) {
        onError(`Content size exceeds the maximum allowed size (${MAX_CONTENT_SIZE / (1024 * 1024)}MB)`);
        setIsProcessing(false);
        return;
      }
      
      // Validate HTML content
      if (!validateHTML(htmlContent)) {
        onError('The entered content does not appear to be valid HTML');
        setIsProcessing(false);
        return;
      }
      
      // Pass content to parent component
      onContentAccepted(htmlContent);
    } catch (error) {
      onError(`Error processing content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [htmlContent, onContentAccepted, onError]);

  // Function to handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlContent(e.target.value);
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
          disabled={isProcessing}
        >
          Insert Example
        </button>
        <button 
          type="button" 
          className="action-button primary"
          onClick={handleSubmit}
          disabled={isProcessing || !htmlContent.trim()}
        >
          {isProcessing ? 'Processing...' : 'Use This HTML'}
        </button>
      </div>
      
      <div className="html-input-info">
        <p>Enter valid HTML content up to {MAX_CONTENT_SIZE / (1024 * 1024)}MB in size.</p>
        <p>The content should include HTML tags for proper conversion to PowerPoint.</p>
      </div>
    </div>
  );
};

export default HtmlInput;